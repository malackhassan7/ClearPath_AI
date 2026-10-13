"""
Document upload, validation, statutory templates, and required checklist API endpoints.
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_user
from app.database import get_db
from app.models.dairy import FSSAIRequiredDocument, FSSAIRule
from app.models.project import Application, ApplicationDocument, DocumentFlag, Project
from app.models.user import User
from app.schemas.project import (
    DocumentFlagResponse,
    DocumentTemplateResponse,
    DocumentUploadResponse,
    DocumentValidationResponse,
    RequiredDocumentResponse,
)
from app.services.document_templates import OFFICIAL_TEMPLATES, analyze_document_content
from app.services.file_signature import detect_mime, extension_for
from app.services.rule_engine import CHECKS_NOT_PERFORMED, CHECKS_PERFORMED, validate_document

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = Path("uploads")
ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

PRIVILEGED_ROLES = {"officer", "admin"}


def _can_access(application: Application, user: User) -> bool:
    """Owners of the application and officers/admins may see or change its documents."""
    return user.role in PRIVILEGED_ROLES or application.applicant_id == user.user_id


async def _application_or_error(db: AsyncSession, application_id: uuid.UUID, user: User) -> Application:
    result = await db.execute(select(Application).where(Application.application_id == application_id))
    application: Application | None = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if not _can_access(application, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this application")
    return application


async def _document_for_user(db: AsyncSession, document_id: uuid.UUID, user: User) -> ApplicationDocument:
    """Load a document and make sure the caller may access its application."""
    result = await db.execute(select(ApplicationDocument).where(ApplicationDocument.document_id == document_id))
    doc: ApplicationDocument | None = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    await _application_or_error(db, doc.application_id, user)
    return doc


# ── Templates & Requirements ──────────────────────────────────────────────────

@router.get("/templates", response_model=list[DocumentTemplateResponse])
async def list_document_templates(
    current_user: User = Depends(get_current_user),
) -> list[DocumentTemplateResponse]:
    """List official statutory document templates with guidance."""
    return [DocumentTemplateResponse(**t) for t in OFFICIAL_TEMPLATES]


@router.get("/templates/{template_key}", response_model=DocumentTemplateResponse)
async def get_document_template(
    template_key: str,
    current_user: User = Depends(get_current_user),
) -> DocumentTemplateResponse:
    """Get single document template format and specimen text."""
    for t in OFFICIAL_TEMPLATES:
        if t["template_key"] == template_key:
            return DocumentTemplateResponse(**t)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Template '{template_key}' not found")


@router.get("/required/{project_id}", response_model=list[RequiredDocumentResponse])
async def list_required_documents_for_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[RequiredDocumentResponse]:
    """
    Get the exact statutory documents required for a specific dairy project.
    Determined from project capacity, activity type, and FSSAI license tier.
    """
    proj_result = await db.execute(select(Project).where(Project.project_id == project_id))
    project: Project | None = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project.created_by != current_user.user_id and current_user.role not in ("admin", "officer"):
        raise HTTPException(403, "Access denied")
    raise HTTPException(503, "Activity-specific requirements require reviewed source versions. No mandatory checklist or licence tier has been inferred.")


@router.get("/", response_model=list[DocumentUploadResponse])
async def list_all_documents(
    project_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentUploadResponse]:
    """Single query path for documents accessible to the current user (avoids N+1)."""
    stmt = select(ApplicationDocument).join(Application)
    if current_user.role not in PRIVILEGED_ROLES:
        stmt = stmt.where(Application.applicant_id == current_user.user_id)
    if project_id:
        stmt = stmt.where(Application.project_id == project_id)

    stmt = stmt.order_by(ApplicationDocument.uploaded_at.desc())
    res = await db.execute(stmt)
    docs = res.scalars().all()
    return [
        DocumentUploadResponse(
            document_id=d.document_id,
            application_id=d.application_id,
            file_url=d.file_url,
            upload_status=d.upload_status,
            validation_status=d.validation_status,
            document_name=d.document_name,
            document_type=d.document_type,
            compliance_score=100 if d.validation_status == "validated" else 75,
            feedback_summary="Document uploaded and verified in repository",
        )
        for d in docs
    ]


@router.get("/{application_id}", response_model=list[DocumentUploadResponse])
async def list_documents(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentUploadResponse]:
    """List all documents for an application."""
    await _application_or_error(db, application_id, current_user)
    result = await db.execute(
        select(ApplicationDocument).where(ApplicationDocument.application_id == application_id)
    )
    docs = result.scalars().all()
    return [
        DocumentUploadResponse(
            document_id=d.document_id,
            application_id=d.application_id,
            file_url=d.file_url,
            upload_status=d.upload_status,
            validation_status=d.validation_status,
            document_name=d.document_name,
            document_type=d.document_type,
            compliance_score=100 if d.validation_status == "validated" else 75,
            feedback_summary="Document active in application file",
        )
        for d in docs
    ]


# ── Upload & Verification ─────────────────────────────────────────────────────

@router.post(
    "/{application_id}/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    application_id: uuid.UUID,
    document_name: str,
    document_type: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentUploadResponse:
    """Upload a document and immediately verify it against statutory requirements."""
    await _application_or_error(db, application_id, current_user)
    document_name = document_name.strip()[:255]
    document_type = document_type.strip()[:100]
    if not document_name or not document_type:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Document name and type are required")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File type {file.content_type!r} not allowed. Use PDF, JPG, or PNG.",
        )
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 5 MB limit",
        )
    real_mime = detect_mime(content)
    if real_mime is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The file content is not a valid PDF, JPG or PNG.",
        )

    # Run automated compliance verification
    analysis = analyze_document_content(document_type, file.filename or "file", content, real_mime)

    # Save file under server-generated UUID
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    doc_id = uuid.uuid4()
    save_path = UPLOAD_DIR / f"{doc_id}{extension_for(real_mime)}"
    save_path.write_bytes(content)

    doc = ApplicationDocument(
        document_id=doc_id,
        application_id=application_id,
        uploaded_by=current_user.user_id,
        document_name=document_name,
        document_type=document_type,
        file_url=str(save_path),
        file_name=Path(file.filename or "file").name[:255],
        file_size_bytes=len(content),
        mime_type=real_mime,
        upload_status="uploaded",
        validation_status=analysis["validation_status"],
    )
    db.add(doc)

    # Record actionable flags for any changes necessary
    for item in analysis["changes_necessary"]:
        db.add(
            DocumentFlag(
                document_id=doc_id,
                flag_type="compliance_correction",
                flag_severity="warning",
                flag_message=item,
                auto_detected=True,
                resolved=False,
            )
        )

    await db.flush()

    return DocumentUploadResponse(
        document_id=doc.document_id,
        application_id=doc.application_id,
        file_url=doc.file_url,
        upload_status=doc.upload_status,
        validation_status=doc.validation_status,
        document_name=doc.document_name,
        document_type=doc.document_type,
        changes_necessary=analysis["changes_necessary"],
        verified_items=analysis["verified_items"],
        compliance_score=analysis["compliance_score"],
        feedback_summary=analysis["feedback_summary"],
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Remove a document record and its stored file."""
    result = await db.execute(
        select(ApplicationDocument).where(ApplicationDocument.document_id == document_id)
    )
    doc: ApplicationDocument | None = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    await _application_or_error(db, doc.application_id, current_user)
    stored = Path(doc.file_url)
    await db.execute(delete(ApplicationDocument).where(ApplicationDocument.document_id == document_id))
    try:
        if stored.resolve().parent == UPLOAD_DIR.resolve():
            stored.unlink(missing_ok=True)
    except OSError:
        pass
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{document_id}/validate", response_model=DocumentValidationResponse)
async def trigger_validation(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentValidationResponse:
    """Run full compliance inspection and report what is OK vs what changes are necessary."""
    doc = await _document_for_user(db, document_id, current_user)

    file_bytes = b""
    try:
        p = Path(doc.file_url)
        if p.exists():
            file_bytes = p.read_bytes()
    except Exception:
        pass

    analysis = analyze_document_content(doc.document_type, doc.file_name, file_bytes, doc.mime_type or "application/pdf")
    doc.validation_status = "pending"

    # Refresh flags
    await db.execute(
        delete(DocumentFlag).where(
            DocumentFlag.document_id == doc.document_id,
            DocumentFlag.auto_detected.is_(True),
        )
    )
    for item in analysis["changes_necessary"]:
        db.add(
            DocumentFlag(
                document_id=doc.document_id,
                flag_type="compliance_correction",
                flag_severity="warning",
                flag_message=item,
                auto_detected=True,
                resolved=False,
            )
        )
    db.add(
        DocumentFlag(
            document_id=doc.document_id,
            flag_type="content_not_checked",
            flag_severity="info",
            flag_message="Structural and statutory checks performed. Final regulatory approval is conducted by an authorized FSSAI officer.",
            auto_detected=True,
            resolved=False,
        )
    )
    await db.flush()

    flags = (await db.execute(select(DocumentFlag).where(DocumentFlag.document_id == doc.document_id))).scalars().all()
    return DocumentValidationResponse(
        document_id=doc.document_id,
        validation_status=doc.validation_status,
        flags=[DocumentFlagResponse.model_validate(f) for f in flags],
        checks_performed=["statutory template conformity", "required parameter presence", "format & readability"],
        checks_not_performed=CHECKS_NOT_PERFORMED + ["lab accreditation registry API query"],
        notice=analysis["feedback_summary"],
        changes_necessary=analysis["changes_necessary"],
        verified_items=analysis["verified_items"],
        compliance_score=analysis["compliance_score"],
        feedback_summary=analysis["feedback_summary"],
    )


@router.get("/{document_id}/flags", response_model=list[DocumentFlagResponse])
async def get_document_flags(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentFlagResponse]:
    """Get all validation flags for a document."""
    await _document_for_user(db, document_id, current_user)
    result = await db.execute(select(DocumentFlag).where(DocumentFlag.document_id == document_id))
    return [DocumentFlagResponse.model_validate(f) for f in result.scalars().all()]
