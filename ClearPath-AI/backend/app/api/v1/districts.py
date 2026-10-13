"""
District Milk Production & Opportunity Finder API endpoints.
All data sourced from data.gov.in (District-wise Milk Production in Tamil Nadu 2009-10 to 2018-19).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.dairy import DistrictMilkProduction
from app.schemas.dairy import DistrictSuitabilityScore
from app.services.rule_engine import get_district_suitability

router = APIRouter(prefix="/districts", tags=["districts"])


@router.get("", summary="List all Tamil Nadu districts with milk production data")
async def list_districts(
    db: AsyncSession = Depends(get_db),
):
    """
    Returns latest milk production figures for all Tamil Nadu districts.
    Data source: data.gov.in
    """
    # Try fetching from database first
    query = (
        select(DistrictMilkProduction)
        .where(DistrictMilkProduction.year == "2018-19")
        .order_by(desc(DistrictMilkProduction.production_thousand_tonnes))
    )
    res = await db.execute(query)
    records = res.scalars().all()

    if records:
        return [
            {
                "district": r.district,
                "year": r.year,
                "production_thousand_tonnes": r.production_thousand_tonnes,
                "data_source": r.source or "data.gov.in",
                "source_url": r.source_url or "https://data.gov.in/resource/time-series-data-details-milk-production-districts-tamil-nadu",
                "retrieved_on": str(r.retrieved_on) if r.retrieved_on else None,
            }
            for r in records
        ]

    # Reference fallback from verified data.gov.in records
    results = []
    # Only rows actually present in PostgreSQL are returned; no embedded district fallback.
    result = await db.execute(select(DistrictMilkProduction).order_by(DistrictMilkProduction.district, DistrictMilkProduction.year))
    rows = result.scalars().all()
    return [{"district": r.district, "year": r.year, "production_thousand_tonnes": r.production_thousand_tonnes, "data_source": r.source, "source_url": r.source_url, "retrieved_on": r.retrieved_on} for r in rows]


@router.get("/suitability-ranking", summary="All Tamil Nadu districts ranked by market suitability")
async def get_suitability_ranking(
    db: AsyncSession = Depends(get_db),
):
    """
    Ranks districts based on 10-year milk production volume and growth momentum.
    Used by the District Opportunity Finder.
    """
    result = await db.execute(select(DistrictMilkProduction.district).distinct().order_by(DistrictMilkProduction.district))
    districts = result.scalars().all()
    ranking = []
    for district_name in districts:
        try:
            ranking.append(await get_district_suitability(district_name, db))
        except HTTPException:
            continue
    return ranking


@router.get("/{district}/milk-production", summary="Historical milk production for a district")
async def get_district_history(
    district: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns 10-year time series milk production (2009-10 to 2018-19) for a district.
    """
    d_clean = district.strip().upper()
    query = (
        select(DistrictMilkProduction)
        .where(DistrictMilkProduction.district.ilike(d_clean))
        .order_by(DistrictMilkProduction.year.asc())
    )
    res = await db.execute(query)
    records = res.scalars().all()

    if records:
        return [
            {
                "district": r.district,
                "year": r.year,
                "production_thousand_tonnes": r.production_thousand_tonnes,
                "source": r.source,
                "source_url": r.source_url,
            }
            for r in records
        ]

    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="No validated source-backed time series is available for this district. The district module is disabled until the original dataset is ingested.")


@router.get("/{district}/suitability", summary="Suitability score and tier for a district")
async def get_district_suitability_endpoint(
    district: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns market opportunity tier (A, B, C, D) and composite score.
    """
    return await get_district_suitability(district, db)
