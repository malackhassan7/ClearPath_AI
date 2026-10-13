"""
ClearPathAI Deterministic Compliance & Rule Evaluation Schemas (Phase 3).
"""
from __future__ import annotations

import uuid
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

ActivityType = Literal["manufacturing", "retail", "distribution"]
EvaluationStatus = Literal["VERIFIED", "PENDING_REGULATORY_REVIEW", "INSUFFICIENT_DATA"]
Applicability = Literal["applicable", "pending_review", "excluded", "unverified"]


class BusinessProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    activities: list[ActivityType] = Field(default_factory=lambda: ["manufacturing"])
    capacity_lpd: float | None = Field(default=None, ge=0)
    annual_turnover_inr: float | None = Field(default=None, ge=0)
    district: str | None = Field(default=None, max_length=100)
    brand_affiliation: str | None = Field(default=None, max_length=100)


class RuleEvaluationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    rule_id: uuid.UUID
    rule_key: str
    activity: str
    kind: str
    version: int
    rule_state: str
    title: str
    source_title: str
    source_issuer: str
    canonical_url: str | None
    page_start: int
    page_end: int
    excerpt: str
    applicability: Applicability
    reason: str


class DocumentRequirementItem(BaseModel):
    name: str
    category: str
    is_mandatory: bool
    source_rule_key: str
    source_pages: str
    review_status: str
    description: str


class ProjectComplianceReport(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    project_id: uuid.UUID | None = None
    project_name: str
    district: str
    activities: list[str]
    capacity_lpd: float | None = None
    annual_turnover_inr: float | None = None
    evaluation_status: EvaluationStatus
    is_authoritative: bool
    suggested_fssai_tier: str | None = None
    tier_explanation: str
    matched_rules: list[RuleEvaluationItem]
    excluded_rules: list[RuleEvaluationItem]
    required_documents: list[DocumentRequirementItem]
    regulatory_disclaimer: str
