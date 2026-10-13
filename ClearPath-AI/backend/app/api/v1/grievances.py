"""
Grievance filing and redressal API endpoints for dairy farmers and entrepreneurs.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.database import get_db
from app.models.grievance import Grievance
from app.models.user import User
from app.schemas.grievance import GrievanceCreate, GrievanceResponse

router = APIRouter(prefix="/grievances", tags=["grievances"])

ALLOWED_GRIEVANCE_STATUSES = {"open", "in_progress", "resolved", "closed"}


@router.get("", summary="List grievances for current user or all if officer/admin", response_model=list[GrievanceResponse])
async def list_grievances(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns submitted grievances. Farmers/entrepreneurs see their own; officers see all assigned grievances.
    """
    if current_user.role in ("officer", "admin"):
        stmt = select(Grievance).order_by(desc(Grievance.created_at))
    else:
        stmt = select(Grievance).where(Grievance.user_id == current_user.user_id).order_by(desc(Grievance.created_at))

    res = await db.execute(stmt)
    records = res.scalars().all()
    return records


@router.post("", status_code=status.HTTP_201_CREATED, summary="File a new grievance", response_model=GrievanceResponse)
async def file_grievance(
    payload: GrievanceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Files a grievance regarding milk payment delays, milk testing discrepancies,
    FSSAI processing delays, or cooperative harassment.
    """
    grievance = Grievance(
        user_id=current_user.user_id,
        category=payload.category,
        description=payload.description,
        organization_id=payload.related_org_id,
        priority=payload.priority,
        status="open",
    )
    db.add(grievance)
    await db.commit()
    await db.refresh(grievance)
    return grievance


@router.put("/{grievance_id}/status", summary="Update grievance status (Officer/Admin only)", response_model=GrievanceResponse)
async def update_grievance_status(
    grievance_id: uuid.UUID,
    new_status: str,
    resolution_notes: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Allows designated officers to update status (submitted -> under_review -> resolved -> closed).
    """
    if current_user.role not in ("officer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only designated regulatory officers or administrators can update grievance status.",
        )
    if new_status not in ALLOWED_GRIEVANCE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"status must be one of: {', '.join(sorted(ALLOWED_GRIEVANCE_STATUSES))}",
        )

    grievance = await db.get(Grievance, grievance_id)
    if not grievance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grievance not found.",
        )

    grievance.status = new_status
    grievance.assigned_to = current_user.user_id
    if resolution_notes:
        grievance.resolution_notes = resolution_notes
    if new_status in ("resolved", "closed"):
        grievance.resolved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(grievance)
    return grievance
