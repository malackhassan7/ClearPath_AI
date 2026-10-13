"""Government schemes API: returns only records ingested into PostgreSQL."""
from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.dairy import GovernmentScheme
router = APIRouter(prefix="/schemes", tags=["schemes"])

@router.get("", summary="List reviewed government scheme records")
async def list_schemes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GovernmentScheme).where(GovernmentScheme.is_active == True).order_by(GovernmentScheme.scheme_name))  # noqa: E712
    return result.scalars().all()

@router.get("/{scheme_id}", summary="Get an ingested government scheme")
async def get_scheme(scheme_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(scheme_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A valid scheme ID is required.")
    scheme = await db.get(GovernmentScheme, uid)
    if scheme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No ingested scheme record was found.")
    return scheme
