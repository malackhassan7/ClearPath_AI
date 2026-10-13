"""
Officer Review Queue & Administration API endpoints.
Provides regulatory review desk, Tier 3 human officer approvals, audit logs, and user control.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import _hash_password, get_current_user
from app.database import get_db
from app.models.notification import AuditLog
from app.models.project import (
    Application,
    ApplicationDocument,
    ApplicationReview,
    ApplicationStatusHistory,
    DocumentFlag,
    Project,
)
from app.models.user import User
from app.schemas.admin import (
    AdminUserCreate,
    AuditLogResponse,
    ReviewQueueItem,
    ReviewResult,
    RoleUpdate,
    UserStatusResult,
)
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])


class ReviewSubmissionRequest(BaseModel):
    review_status: Literal["approved", "rejected", "attention_needed", "under_review"]
    reason: str = Field(..., min_length=5, description="Mandatory detailed reason for regulatory decision")
    notes: str | None = None


def require_officer_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("officer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to authorized regulatory officers and administrators.",
        )
    return current_user


@router.get("/review-queue", summary="Pending applications for officer review", response_model=list[ReviewQueueItem])
async def get_review_queue(
    status_filter: str | None = Query(None, alias="status"),
    officer: User = Depends(require_officer_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns applications ready for officer inspection with document counts and detected flags.
    """
    stmt = (
        select(Application)
        .options(
            selectinload(Application.project),
            selectinload(Application.documents).selectinload(ApplicationDocument.flags),
            selectinload(Application.reviews),
        )
        .order_by(desc(Application.created_at))
    )
    if status_filter:
        stmt = stmt.where(Application.status == status_filter)

    res = await db.execute(stmt)
    apps = res.scalars().all()

    queue_items = []
    for app in apps:
        total_flags = sum(len(d.flags) for d in app.documents)
        unresolved_flags = sum(
            sum(1 for f in d.flags if not f.resolved) for d in app.documents
        )
        queue_items.append({
            "application_id": app.application_id,
            "project_id": app.project_id,
            "project_name": app.project.project_name if app.project else "Unnamed Project",
            "district": app.project.district if app.project else "Unknown",
            "application_type": app.application_type,
            "license_tier": app.license_tier,
            "status": app.status,
            "applied_date": app.submission_date,
            "documents_count": len(app.documents),
            "unresolved_flags_count": unresolved_flags,
            "total_flags_count": total_flags,
            "created_at": app.created_at,
        })
    return queue_items


@router.post("/applications/{application_id}/review", summary="Submit Tier 3 human officer review decision", response_model=ReviewResult)
async def submit_officer_review(
    application_id: uuid.UUID,
    payload: ReviewSubmissionRequest,
    officer: User = Depends(require_officer_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Officer records final decision: Approved, Rejected, or Attention Needed with mandatory reasoning.
    Creates an immutable audit log entry.
    """
    app = await db.get(Application, application_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    old_status = app.status
    app.status = payload.review_status

    # 1. Record application review
    review = ApplicationReview(
        application_id=app.application_id,
        reviewer_id=officer.user_id,
        decision=payload.review_status,
        comments=payload.reason if not payload.notes else f"{payload.reason}\n\nNotes: {payload.notes}",
    )
    db.add(review)

    # 2. Record status history
    history = ApplicationStatusHistory(
        application_id=app.application_id,
        old_status=old_status,
        new_status=payload.review_status,
        changed_by=officer.user_id,
        notes=payload.reason,
    )
    db.add(history)

    # 3. Record audit log
    audit = AuditLog(
        actor_id=officer.user_id,
        action="APPLICATION_REVIEW_SUBMITTED",
        entity_type="application",
        entity_id=app.application_id,
        old_values={"status": old_status},
        new_values={"status": payload.review_status, "reason": payload.reason},
    )
    db.add(audit)

    await db.commit()
    await db.refresh(review)

    return {
        "status": "success",
        "application_id": str(application_id),
        "new_status": payload.review_status,
        "reviewed_by": officer.full_name,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Final regulatory determination recorded by authorized desk officer.",
    }


@router.get("/audit-logs", summary="System audit trail", response_model=list[AuditLogResponse])
async def list_audit_logs(
    officer: User = Depends(require_officer_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns audit trail of all regulatory actions, status changes, and user reviews.
    """
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(100)
    res = await db.execute(stmt)
    records = res.scalars().all()
    return records


@router.get("/users", summary="List all registered users (Admin only)", response_model=list[UserResponse])
async def list_all_users(
    officer: User = Depends(require_officer_or_admin),
    db: AsyncSession = Depends(get_db),
):
    if officer.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User management is restricted to system administrators.",
        )
    stmt = select(User).order_by(desc(User.created_at)).limit(100)
    res = await db.execute(stmt)
    users = res.scalars().all()
    return users


@router.put("/users/{user_id}/status", summary="Activate or deactivate user account", response_model=UserStatusResult)
async def update_user_status(
    user_id: uuid.UUID,
    is_active: bool,
    officer: User = Depends(require_officer_or_admin),
    db: AsyncSession = Depends(get_db),
):
    if officer.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permission required.",
        )
    if user_id == officer.user_id and not is_active:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You cannot deactivate your own account.")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    db.add(AuditLog(
        actor_id=officer.user_id, action="USER_STATUS_CHANGED", entity_type="user", entity_id=user.user_id,
        old_values={"is_active": user.is_active}, new_values={"is_active": is_active},
    ))
    user.is_active = is_active
    await db.commit()
    return {"status": "success", "user_id": str(user_id), "is_active": is_active}


def _require_admin(officer: User = Depends(require_officer_or_admin)) -> User:
    if officer.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required.")
    return officer


@router.post("/users", summary="Create an account with any role (Admin only)", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: AdminUserCreate,
    admin: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    email_clean = body.email.strip().lower()
    existing = await db.execute(select(User).where(func.lower(User.email) == email_clean))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists")
    user = User(
        full_name=body.full_name, email=email_clean, phone=body.phone,
        password_hash=_hash_password(body.password), role=body.role, email_verified=True,
    )
    db.add(user)
    await db.flush()
    db.add(AuditLog(
        actor_id=admin.user_id, action="USER_CREATED", entity_type="user", entity_id=user.user_id,
        new_values={"role": body.role, "email": body.email},
    ))
    await db.commit()
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}/role", summary="Change a user's role (Admin only)", response_model=UserResponse)
async def change_user_role(
    user_id: uuid.UUID,
    body: RoleUpdate,
    admin: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.user_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You cannot change your own role.")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    db.add(AuditLog(
        actor_id=admin.user_id, action="USER_ROLE_CHANGED", entity_type="user", entity_id=user.user_id,
        old_values={"role": user.role}, new_values={"role": body.role, "reason": body.reason},
    ))
    user.role = body.role
    await db.commit()
    return UserResponse.model_validate(user)
