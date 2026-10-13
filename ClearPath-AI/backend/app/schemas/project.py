"""
Project and Application Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


# ── Project ───────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    project_name: str = Field(..., max_length=255)
    district: str = Field(..., max_length=100)
    business_type_id: uuid.UUID | None = None
    brand_id: uuid.UUID | None = None
    capacity_lpd: float | None = None
    annual_turnover: Decimal | None = None
    notes: str | None = None


class ProjectUpdate(BaseModel):
    project_name: str | None = Field(None, max_length=255)
    district: str | None = Field(None, max_length=100)
    business_type_id: uuid.UUID | None = None
    brand_id: uuid.UUID | None = None
    capacity_lpd: float | None = None
    annual_turnover: Decimal | None = None
    status: str | None = None
    notes: str | None = None


class ProjectResponse(BaseModel):
    model_config = {"from_attributes": True}

    project_id: uuid.UUID
    organization_id: uuid.UUID | None
    created_by: uuid.UUID
    project_name: str
    district: str
    business_type_id: uuid.UUID | None
    brand_id: uuid.UUID | None
    capacity_lpd: float | None
    annual_turnover: Decimal | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime


# ── Application ───────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    project_id: uuid.UUID
    application_type: str = Field(..., max_length=100)
    license_tier: str | None = Field(None, max_length=50)
    fssai_rule_id: uuid.UUID | None = None
    notes: str | None = None


class ApplicationResponse(BaseModel):
    model_config = {"from_attributes": True}

    application_id: uuid.UUID
    project_id: uuid.UUID
    applicant_id: uuid.UUID
    application_type: str
    license_tier: str | None
    status: str
    submission_date: datetime | None
    decision_date: datetime | None
    fssai_rule_id: uuid.UUID | None
    estimated_fee_inr: Decimal | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    model_config = {"from_attributes": True}

    document_id: uuid.UUID
    application_id: uuid.UUID | None = None
    file_url: str
    upload_status: str
    validation_status: str
    document_name: str
    document_type: str | None = None
    changes_necessary: list[str] = []
    verified_items: list[str] = []
    compliance_score: int = 100
    feedback_summary: str | None = None


class DocumentValidationResponse(BaseModel):
    document_id: uuid.UUID
    validation_status: str
    flags: list["DocumentFlagResponse"]
    checks_performed: list[str]
    checks_not_performed: list[str]
    notice: str
    changes_necessary: list[str] = []
    verified_items: list[str] = []
    compliance_score: int = 100
    feedback_summary: str | None = None


class DocumentTemplateResponse(BaseModel):
    template_key: str
    title: str
    category: str
    authority: str
    citation: str
    description: str
    mandatory_fields: list[str]
    sample_text: str


class RequiredDocumentResponse(BaseModel):
    document_name: str
    description: str | None
    is_mandatory: bool
    template_key: str | None
    template_url: str | None
    source_url: str | None


class DocumentFlagResponse(BaseModel):
    model_config = {"from_attributes": True}

    flag_id: uuid.UUID
    document_id: uuid.UUID
    flag_type: str
    flag_severity: str
    flag_message: str
    auto_detected: bool
    resolved: bool
    created_at: datetime


# ── Review ────────────────────────────────────────────────────────────────────

class ApplicationReviewCreate(BaseModel):
    decision: str = Field(..., pattern="^(approve|reject|return)$")
    comments: str | None = None
    checklist: dict | None = None


class ApplicationReviewResponse(BaseModel):
    model_config = {"from_attributes": True}

    review_id: uuid.UUID
    application_id: uuid.UUID
    reviewer_id: uuid.UUID
    decision: str
    comments: str | None
    checklist: dict | None
    created_at: datetime


class StatusUpdateRequest(BaseModel):
    status: str = Field(
        ...,
        pattern="^(draft|submitted|under_review|approved|rejected|returned)$"
    )
    notes: str | None = None

DocumentValidationResponse.model_rebuild()
