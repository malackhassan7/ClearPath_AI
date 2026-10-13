"""
Grievance Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class GrievanceCreate(BaseModel):
    category: str = Field(..., max_length=100)
    description: str = Field(..., min_length=10)
    related_org_id: uuid.UUID | None = None
    priority: str = Field("medium", pattern="^(low|medium|high|urgent)$")


class GrievanceUpdate(BaseModel):
    status: str | None = Field(None, pattern="^(open|in_progress|resolved|closed)$")
    priority: str | None = Field(None, pattern="^(low|medium|high|urgent)$")
    resolution_notes: str | None = None
    assigned_to: uuid.UUID | None = None


class GrievanceResponse(BaseModel):
    model_config = {"from_attributes": True}

    grievance_id: uuid.UUID
    user_id: uuid.UUID | None
    organization_id: uuid.UUID | None
    category: str
    description: str
    status: str
    priority: str
    resolution_notes: str | None
    assigned_to: uuid.UUID | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime
