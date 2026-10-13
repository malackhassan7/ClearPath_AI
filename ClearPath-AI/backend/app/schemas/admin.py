"""Response/request schemas for admin, notification and conversation endpoints.

Every field is listed explicitly so that internal columns (password_hash, ip_address, user_agent ...)
can never be serialised by accident.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.auth import UserResponse

AdminUserResponse = UserResponse  # public fields only; no password_hash


class AuditLogResponse(BaseModel):
    model_config = {"from_attributes": True}

    log_id: uuid.UUID
    actor_id: uuid.UUID | None
    action: str
    entity_type: str
    entity_id: uuid.UUID | None
    old_values: dict[str, Any] | None
    new_values: dict[str, Any] | None
    created_at: datetime


class NotificationResponse(BaseModel):
    model_config = {"from_attributes": True}

    notification_id: uuid.UUID
    title: str
    message: str
    notification_type: str
    is_read: bool
    related_entity_type: str | None
    related_entity_id: uuid.UUID | None
    created_at: datetime


class ConversationResponse(BaseModel):
    model_config = {"from_attributes": True}

    conversation_id: uuid.UUID
    question: str
    answer: str
    language: str
    sources: list[Any] | None
    created_at: datetime


class ReviewQueueItem(BaseModel):
    application_id: uuid.UUID
    project_id: uuid.UUID
    project_name: str
    district: str
    application_type: str
    license_tier: str | None
    status: str
    applied_date: datetime | None
    documents_count: int
    unresolved_flags_count: int
    total_flags_count: int
    created_at: datetime


class ReviewResult(BaseModel):
    status: str
    application_id: str
    new_status: str
    reviewed_by: str
    reviewed_at: str
    disclaimer: str


class UserStatusResult(BaseModel):
    status: str
    user_id: str
    is_active: bool


class AdminUserCreate(BaseModel):
    """Only an administrator can create officer/admin accounts."""

    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = Field(None, max_length=15, pattern=r"^\+?[0-9]{7,15}$")
    password: str = Field(..., min_length=8, max_length=128)
    role: Literal["user", "farmer", "entrepreneur", "consultant", "officer", "admin"]


class RoleUpdate(BaseModel):
    role: Literal["user", "farmer", "entrepreneur", "consultant", "officer", "admin"]
    reason: str = Field(..., min_length=5, max_length=500)
