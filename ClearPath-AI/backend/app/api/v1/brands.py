"""
Brand API endpoints.
- GET /brands
- GET /brands/{brand_id}
- GET /brands/compare
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_user, require_roles
from app.database import get_db
from app.models.dairy import Brand
from app.models.user import User
from app.schemas.dairy import BrandCreate, BrandRequirementResponse, BrandResponse

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("/compare", response_model=dict)
async def compare_brands(
    brand_ids: str = Query(..., description="Comma-separated brand UUIDs"),
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Side-by-side comparison of multiple brands and their requirements."""
    ids: list[uuid.UUID] = []
    for part in brand_ids.split(","):
        try:
            ids.append(uuid.UUID(part.strip()))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid UUID: {part.strip()}")

    if not ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No brand IDs provided")

    result = await db.execute(
        select(Brand).where(Brand.brand_id.in_(ids)).options(selectinload(Brand.requirements))
    )
    brands = result.scalars().all()

    comparison: dict = {}
    for brand in brands:
        comparison[str(brand.brand_id)] = {
            "brand": BrandResponse.model_validate(brand),
            "requirements": [BrandRequirementResponse.model_validate(r) for r in brand.requirements],
        }
    return comparison


@router.get("/", response_model=list[BrandResponse])
async def list_brands(
    active_only: bool = True,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BrandResponse]:
    """List all brands."""
    query = select(Brand)
    if active_only:
        query = query.where(Brand.is_active == True)  # noqa: E712
    result = await db.execute(query.order_by(Brand.brand_name))
    brands = result.scalars().all()
    return [BrandResponse.model_validate(b) for b in brands]


@router.get("/{brand_id}", response_model=dict)
async def get_brand(
    brand_id: uuid.UUID,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get brand detail including all requirements."""
    result = await db.execute(
        select(Brand).where(Brand.brand_id == brand_id).options(selectinload(Brand.requirements))
    )
    brand: Brand | None = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return {
        "brand": BrandResponse.model_validate(brand),
        "requirements": [BrandRequirementResponse.model_validate(r) for r in brand.requirements],
    }


@router.post("/", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    body: BrandCreate,
    _: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
) -> BrandResponse:
    """Create a new brand (administrator only)."""
    brand = Brand(**body.model_dump())
    db.add(brand)
    await db.flush()
    return BrandResponse.model_validate(brand)
