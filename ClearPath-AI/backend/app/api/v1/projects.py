"""
Projects API – full CRUD for projects and applications.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_user
from app.database import get_db
from app.models.project import Application, Project
from app.models.user import User
from app.schemas.project import (
    ApplicationCreate,
    ApplicationResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectResponse]:
    """List projects created by the current user."""
    result = await db.execute(
        select(Project)
        .where(Project.created_by == current_user.user_id)
        .offset(skip)
        .limit(limit)
        .order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return [ProjectResponse.model_validate(p) for p in projects]


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    """Create a new project."""
    project = Project(
        created_by=current_user.user_id,
        **body.model_dump(),
    )
    db.add(project)
    await db.flush()
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    """Get a project by ID."""
    result = await db.execute(select(Project).where(Project.project_id == project_id))
    project: Project | None = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.created_by != current_user.user_id and current_user.role not in ("admin", "officer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return ProjectResponse.model_validate(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    """Update a project."""
    result = await db.execute(select(Project).where(Project.project_id == project_id))
    project: Project | None = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.created_by != current_user.user_id and current_user.role not in ("admin",):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    await db.flush()
    return ProjectResponse.model_validate(project)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Delete a project (only if no submitted applications)."""
    result = await db.execute(select(Project).where(Project.project_id == project_id))
    project: Project | None = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.created_by != current_user.user_id and current_user.role not in ("admin",):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    await db.delete(project)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Application sub-resource ──────────────────────────────────────────────────

async def _project_for_user(db: AsyncSession, project_id: uuid.UUID, user: User, *, write: bool) -> Project:
    """404 if missing; 403 unless the caller owns it (officers may read, admins may read/write)."""
    result = await db.execute(select(Project).where(Project.project_id == project_id))
    project: Project | None = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    privileged = ("admin",) if write else ("admin", "officer")
    if project.created_by != user.user_id and user.role not in privileged:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return project


@router.get("/{project_id}/applications", response_model=list[ApplicationResponse])
async def list_project_applications(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ApplicationResponse]:
    """List applications for a project (owner, officer or admin)."""
    await _project_for_user(db, project_id, current_user, write=False)
    result = await db.execute(
        select(Application)
        .where(Application.project_id == project_id)
        .order_by(Application.created_at.desc())
    )
    apps = result.scalars().all()
    return [ApplicationResponse.model_validate(a) for a in apps]


@router.post("/{project_id}/applications", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    project_id: uuid.UUID,
    body: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    """Create an application under a project (owner or admin only)."""
    await _project_for_user(db, project_id, current_user, write=True)

    application = Application(
        project_id=project_id,
        applicant_id=current_user.user_id,
        application_type=body.application_type,
        license_tier=body.license_tier,
        fssai_rule_id=body.fssai_rule_id,
        notes=body.notes,
    )
    db.add(application)
    await db.flush()
    return ApplicationResponse.model_validate(application)
