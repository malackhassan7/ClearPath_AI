"""
Dairy-domain Pydantic v2 schemas.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


# ── Brand ─────────────────────────────────────────────────────────────────────

class BrandCreate(BaseModel):
    brand_name: str = Field(..., max_length=150)
    brand_type: str = Field(..., max_length=50)
    description: str | None = None
    logo_url: str | None = None
    website_url: str | None = None
    contact_email: str | None = None


class BrandResponse(BaseModel):
    model_config = {"from_attributes": True}

    brand_id: uuid.UUID
    brand_name: str
    brand_type: str
    description: str | None
    logo_url: str | None
    website_url: str | None
    contact_email: str | None
    is_active: bool
    created_at: datetime


class BrandRequirementResponse(BaseModel):
    model_config = {"from_attributes": True}

    requirement_id: uuid.UUID
    brand_id: uuid.UUID
    requirement_type: str
    requirement_name: str
    description: str | None
    is_mandatory: bool
    fee_amount: Decimal | None
    fee_currency: str
    template_url: str | None
    source_url: str | None
    last_verified_on: date | None
    rule_status: str


# ── BusinessType ──────────────────────────────────────────────────────────────

class BusinessTypeResponse(BaseModel):
    model_config = {"from_attributes": True}

    business_type_id: uuid.UUID
    type_name: str
    type_code: str
    description: str | None
    typical_capacity_min_lpd: int | None
    typical_capacity_max_lpd: int | None
    is_active: bool


# ── FSSAI ─────────────────────────────────────────────────────────────────────

class FSSAIRuleResponse(BaseModel):
    model_config = {"from_attributes": True}

    rule_id: uuid.UUID
    business_type_id: uuid.UUID
    license_tier: str
    license_form: str
    capacity_min_lpd: int | None
    capacity_max_lpd: int | None
    turnover_min_inr: Decimal | None
    turnover_max_inr: Decimal | None
    annual_fee_inr: Decimal
    validity_years: int
    source_url: str | None
    effective_date: date | None
    last_verified_on: date | None
    notes: str | None


class DocumentChecklistItem(BaseModel):
    document_name: str
    is_mandatory: bool
    source_url: str | None = None
    template_url: str | None = None
    description: str | None = None


class CostBreakdown(BaseModel):
    fssai_fee: Decimal
    brand_deposit: Decimal
    other_fees: Decimal
    total: Decimal
    currency: str = "INR"
    notes: str | None = None


# ── District ──────────────────────────────────────────────────────────────────

class DistrictSuitabilityScore(BaseModel):
    district: str
    production_2018_19: float
    growth_rate_percent: float
    suitability_tier: Literal["A", "B", "C", "D"]
    suitability_score: float
    data_source: str
    retrieved_on: date | None


# ── Business Classification ───────────────────────────────────────────────────

class ClassifyBusinessRequest(BaseModel):
    answers: dict = Field(
        ...,
        description=(
            "Keys: activity (retail/franchise/processing/distribution/collection), "
            "brand_affiliation (aavin/private/independent), "
            "capacity_lpd (int), annual_turnover (float)"
        ),
    )


class ClassifyBusinessResponse(BaseModel):
    business_type_id: uuid.UUID
    business_type_name: str
    fssai_tier: str
    reasoning: str


# ── Government Schemes ────────────────────────────────────────────────────────

class GovernmentSchemeResponse(BaseModel):
    model_config = {"from_attributes": True}

    scheme_id: uuid.UUID
    scheme_name: str
    sponsoring_body: str
    scheme_type: str
    description: str | None
    eligibility_criteria: str | None
    benefit_amount_inr: Decimal | None
    benefit_description: str | None
    application_url: str | None
    source_url: str | None
    is_active: bool
    valid_from: date | None
    valid_until: date | None
    last_verified_on: date | None
