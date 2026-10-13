import uuid
from pathlib import PurePosixPath

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import ValidationError
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user, require_roles
from app.database import get_db
from app.models.registry import SourceVersion, RegistryRule
from app.models.user import User
from app.schemas.registry import (SourceMetadata, SourceResponse, RuleCreate, RuleResponse,
                                  ReviewRequest, ConflictRequest, SourcePageResponse, Activity)
from app.services import registry

router = APIRouter(tags=["source-registry"], dependencies=[Depends(get_current_user)])
editor = require_roles("admin", "officer")


@router.get("/sources", response_model=list[SourceResponse])
async def sources(db: AsyncSession = Depends(get_db)):
    return (await db.execute(select(SourceVersion).order_by(SourceVersion.source_key, SourceVersion.version.desc()))).scalars().all()


@router.get("/sources/versions/{version_id}", response_model=SourceResponse)
async def source_version(version_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch a single source version record by ID."""
    return await registry.get_entity(db, SourceVersion, version_id)


@router.post("/sources/{source_key}/versions", response_model=SourceResponse, status_code=201)
async def upload_version(source_key: str, metadata: str = Form(...), file: UploadFile = File(...),
                         actor: User = Depends(editor), db: AsyncSession = Depends(get_db)):
    import re
    if not re.fullmatch(r"[a-z0-9][a-z0-9_-]{1,99}", source_key):
        raise HTTPException(422, "Invalid source key.")
    try:
        parsed = SourceMetadata.model_validate_json(metadata)
    except ValidationError:
        raise HTTPException(422, "Invalid source metadata; use the documented schema.") from None
    content = await file.read(registry.MAX_BYTES + 1)
    filename = PurePosixPath((file.filename or "source.pdf").replace("\\", "/")).name[:255]
    return await registry.import_source(db, source_key, filename, content, parsed, actor.user_id)


@router.get("/sources/versions/{version_id}/pages/{page}", response_model=SourcePageResponse)
async def source_page(version_id: uuid.UUID, page: int, db: AsyncSession = Depends(get_db)):
    source = await registry.get_entity(db, SourceVersion, version_id)
    if not 1 <= page <= source.page_count:
        raise HTTPException(404, "Page not found.")
    return dict(source_version_id=source.id, sha256=source.sha256, page=page, text=source.pages[page - 1])


@router.get("/sources/versions/{version_id}/file", response_class=Response)
async def source_file(version_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    source = await registry.get_entity(db, SourceVersion, version_id)
    return Response(source.content, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="source-{version_id}.pdf"',
        "X-Content-SHA256": source.sha256,
        "X-Content-Type-Options": "nosniff",
    })


@router.post("/sources/versions/{version_id}/review", response_model=SourceResponse)
async def review_source(version_id: uuid.UUID, body: ReviewRequest, actor: User = Depends(editor), db: AsyncSession = Depends(get_db)):
    return await registry.review(db, SourceVersion, version_id, body, actor)


@router.post("/sources/versions/{version_id}/conflict", response_model=SourceResponse)
async def source_conflict(version_id: uuid.UUID, body: ConflictRequest, actor: User = Depends(editor), db: AsyncSession = Depends(get_db)):
    return await registry.set_conflict(db, SourceVersion, version_id, body, actor)


@router.get("/registry/rules", response_model=list[RuleResponse])
async def rules(activity: Activity | None = None, db: AsyncSession = Depends(get_db)):
    query = select(RegistryRule).order_by(RegistryRule.rule_key, RegistryRule.activity, RegistryRule.version.desc())
    if activity:
        query = query.where(RegistryRule.activity == activity)
    return (await db.execute(query)).scalars().all()


@router.get("/registry/rules/{rule_id}", response_model=RuleResponse)
async def get_rule(rule_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch a single registry rule by ID."""
    return await registry.get_entity(db, RegistryRule, rule_id)


@router.post("/registry/rules", response_model=RuleResponse, status_code=201)
async def draft_rule(body: RuleCreate, actor: User = Depends(editor), db: AsyncSession = Depends(get_db)):
    return await registry.create_rule(db, body, actor.user_id)


@router.post("/registry/rules/{rule_id}/review", response_model=RuleResponse)
async def review_rule(rule_id: uuid.UUID, body: ReviewRequest, actor: User = Depends(editor), db: AsyncSession = Depends(get_db)):
    return await registry.review(db, RegistryRule, rule_id, body, actor)


@router.post("/registry/rules/{rule_id}/conflict", response_model=RuleResponse)
async def rule_conflict(rule_id: uuid.UUID, body: ConflictRequest, actor: User = Depends(editor), db: AsyncSession = Depends(get_db)):
    return await registry.set_conflict(db, RegistryRule, rule_id, body, actor)
