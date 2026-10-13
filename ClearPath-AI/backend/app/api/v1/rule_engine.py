"""
Rule Engine API router.
Provides FSSAI classification, document checklist generation, fee breakdown,
and district opportunity calculations.
"""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.database import get_db
from app.schemas.dairy import (
    ClassifyBusinessRequest,
    ClassifyBusinessResponse,
    CostBreakdown,
    DocumentChecklistItem,
)
from app.services.rule_engine import (
    calculate_total_cost,
    classify_business_type,
    get_district_suitability,
    get_fssai_rule,
    get_required_documents,
)

router = APIRouter(prefix="/rule-engine", tags=["rule-engine"], dependencies=[Depends(get_current_user)])


class FSSAIRuleRequest(BaseModel):
    business_type_id: str
    capacity_lpd: float = 0
    turnover: float = 0


class DocumentChecklistRequest(BaseModel):
    rule_id: str | None = None
    brand_id: str | None = None
    business_type: str | None = None


class CostEstimateRequest(BaseModel):
    rule_id: str | None = None
    brand_id: str | None = None
    business_type: str | None = None
    capacity_lpd: float = 0
    annual_turnover: float = 0


@router.post("/classify", summary="Classify business type and FSSAI tier based on scale")
async def classify_endpoint(
    payload: ClassifyBusinessRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Maps user questionnaire answers (activity, brand affiliation, capacity, turnover)
    to the statutory business_type_id and determines FSSAI license tier.
    """
    return await classify_business_type(payload.answers, db)


@router.post("/fssai-rule", summary="Find matching FSSAI statutory rule")
async def fssai_rule_endpoint(
    payload: FSSAIRuleRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns applicable FSSAI statutory rule (Registration / State / Central)
    along with fee and statutory source citation.
    """
    return await get_fssai_rule(
        business_type_id=payload.business_type_id,
        capacity_lpd=payload.capacity_lpd,
        turnover=payload.turnover,
        db=db,
    )


@router.post("/document-checklist", summary="Generate required documents checklist")
async def checklist_endpoint(
    payload: DocumentChecklistRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generates unified checklist combining statutory FSSAI and brand-specific requirements.
    """
    return await get_required_documents(
        rule_id=payload.rule_id,
        brand_id=payload.brand_id,
        business_type=payload.business_type,
        db=db,
    )


@router.post("/cost-estimate", summary="Compute total compliance and franchise cost breakdown")
async def cost_estimate_endpoint(
    payload: CostEstimateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Computes breakdown of FSSAI fee, brand deposit, and documentation fees.
    """
    return await calculate_total_cost(
        rule_id=payload.rule_id,
        brand_id=payload.brand_id,
        business_type=payload.business_type,
        capacity_lpd=payload.capacity_lpd,
        turnover=payload.annual_turnover,
        db=db,
    )


@router.get("/district-suitability/{district}", summary="Get suitability score for a district")
async def district_suitability_endpoint(
    district: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Calculates district opportunity tier and 10-year milk production trend.
    """
    return await get_district_suitability(district, db)
