"""
Clearances API – application lifecycle management.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_user, require_roles
from app.database import get_db
from app.models.project import Application, ApplicationStatusHistory, Project
from app.models.user import User
from app.schemas.project import ApplicationCreate, ApplicationResponse, StatusUpdateRequest

router = APIRouter(prefix="/clearances", tags=["clearances"])


@router.get("/", response_model=list[ApplicationResponse])
async def list_clearances(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ApplicationResponse]:
    """List applications for the current user."""
    result = await db.execute(
        select(Application)
        .where(Application.applicant_id == current_user.user_id)
        .offset(skip)
        .limit(limit)
        .order_by(Application.created_at.desc())
    )
    apps = result.scalars().all()
    return [ApplicationResponse.model_validate(a) for a in apps]


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_clearance(
    body: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    """Create a new clearance/application."""
    # Validate project ownership
    proj_result = await db.execute(select(Project).where(Project.project_id == body.project_id))
    project: Project | None = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.created_by != current_user.user_id and current_user.role not in ("admin",):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project")

    application = Application(
        project_id=body.project_id,
        applicant_id=current_user.user_id,
        application_type=body.application_type,
        license_tier=body.license_tier,
        fssai_rule_id=body.fssai_rule_id,
        notes=body.notes,
    )
    db.add(application)
    await db.flush()
    return ApplicationResponse.model_validate(application)


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_clearance(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    """Get application detail including documents and flags."""
    result = await db.execute(
        select(Application)
        .where(Application.application_id == application_id)
        .options(
            selectinload(Application.documents),
            selectinload(Application.reviews),
        )
    )
    application: Application | None = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if (
        application.applicant_id != current_user.user_id
        and current_user.role not in ("admin", "officer")
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return ApplicationResponse.model_validate(application)


@router.put("/{application_id}/status", response_model=ApplicationResponse)
async def update_status(
    application_id: uuid.UUID,
    body: StatusUpdateRequest,
    current_user: User = Depends(require_roles("officer", "admin")),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    """Update application status (officer/admin only)."""
    result = await db.execute(
        select(Application).where(Application.application_id == application_id)
    )
    application: Application | None = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    old_status = application.status
    application.status = body.status
    if body.status in ("approved", "rejected"):
        application.decision_date = datetime.now(timezone.utc)

    # Record history
    history = ApplicationStatusHistory(
        application_id=application_id,
        changed_by=current_user.user_id,
        old_status=old_status,
        new_status=body.status,
        notes=body.notes,
    )
    db.add(history)
    await db.flush()
    return ApplicationResponse.model_validate(application)


@router.post("/{application_id}/submit", response_model=ApplicationResponse)
async def submit_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    """Submit a draft application for review."""
    result = await db.execute(
        select(Application).where(Application.application_id == application_id)
    )
    application: Application | None = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if application.applicant_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if application.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot submit application in status '{application.status}'",
        )

    old_status = application.status
    application.status = "submitted"
    application.submission_date = datetime.now(timezone.utc)

    history = ApplicationStatusHistory(
        application_id=application_id,
        changed_by=current_user.user_id,
        old_status=old_status,
        new_status="submitted",
        notes="Application submitted by applicant",
    )
    db.add(history)
    await db.flush()
    return ApplicationResponse.model_validate(application)
