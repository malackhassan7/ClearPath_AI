"""
All dairy-related ORM models: Brand, BrandRequirement, BusinessType,
FSSAIRule, FSSAIRequiredDocument, DistrictMilkProduction, Farmer,
MilkCollection, ProductBatch, GovernmentScheme.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Brand(Base):
    __tablename__ = "brands"

    brand_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    brand_type: Mapped[str] = mapped_column(String(50), nullable=False)  # cooperative/private
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    requirements: Mapped[list[BrandRequirement]] = relationship(
        "BrandRequirement", back_populates="brand", lazy="select"
    )
    projects: Mapped[list["Project"]] = relationship(  # noqa: F821
        "Project", back_populates="brand", lazy="select"
    )


class BrandRequirement(Base):
    __tablename__ = "brand_requirements"
    __table_args__ = (
        UniqueConstraint("brand_id", "requirement_name", name="uq_brand_requirements_brand_req_name"),
        CheckConstraint(
            "rule_status IN ('unverified', 'needs_review', 'verified', 'superseded', 'disabled')",
            name="ck_brand_requirements_rule_status",
        ),
    )

    requirement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="CASCADE"), nullable=False
    )
    requirement_type: Mapped[str] = mapped_column(String(100), nullable=False)  # document/fee/other
    requirement_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    fee_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    fee_currency: Mapped[str] = mapped_column(String(5), default="INR")
    template_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_verified_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    rule_status: Mapped[str] = mapped_column(String(20), default="unverified")  # verified/unverified
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    brand: Mapped[Brand] = relationship("Brand", back_populates="requirements")


class BusinessType(Base):
    __tablename__ = "business_types"

    business_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    type_name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    type_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    typical_capacity_min_lpd: Mapped[int | None] = mapped_column(Integer, nullable=True)
    typical_capacity_max_lpd: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    fssai_rules: Mapped[list[FSSAIRule]] = relationship(
        "FSSAIRule", back_populates="business_type", lazy="select"
    )
    projects: Mapped[list["Project"]] = relationship(  # noqa: F821
        "Project", back_populates="business_type", lazy="select"
    )


class FSSAIRule(Base):
    __tablename__ = "fssai_rules"
    __table_args__ = (
        CheckConstraint(
            "rule_status IN ('unverified', 'needs_review', 'verified', 'superseded', 'disabled')",
            name="ck_fssai_rules_rule_status",
        ),
    )

    rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    business_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_types.business_type_id", ondelete="CASCADE"),
        nullable=False,
    )
    license_tier: Mapped[str] = mapped_column(String(50), nullable=False)  # registration/state/central
    license_form: Mapped[str] = mapped_column(String(20), nullable=False)  # Form A/Form B/Form C
    capacity_min_lpd: Mapped[int | None] = mapped_column(Integer, nullable=True)
    capacity_max_lpd: Mapped[int | None] = mapped_column(Integer, nullable=True)
    turnover_min_inr: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    turnover_max_inr: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    annual_fee_inr: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    rule_status: Mapped[str] = mapped_column(String(20), default="unverified")
    validity_years: Mapped[int] = mapped_column(Integer, default=1)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_verified_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    business_type: Mapped[BusinessType] = relationship("BusinessType", back_populates="fssai_rules")
    required_documents: Mapped[list[FSSAIRequiredDocument]] = relationship(
        "FSSAIRequiredDocument", back_populates="rule", lazy="select"
    )


class FSSAIRequiredDocument(Base):
    __tablename__ = "fssai_required_documents"

    doc_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("fssai_rules.rule_id", ondelete="CASCADE"),
        nullable=False,
    )
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    template_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    rule: Mapped[FSSAIRule] = relationship("FSSAIRule", back_populates="required_documents")


class DistrictMilkProduction(Base):
    __tablename__ = "district_milk_production"
    __table_args__ = (
        UniqueConstraint("district", "year", name="uq_district_milk_production_district_year"),
    )

    record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[str] = mapped_column(String(10), nullable=False)  # e.g. '2018-19'
    production_thousand_tonnes: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    retrieved_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Farmer(Base):
    __tablename__ = "farmers"

    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    farmer_code: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    village: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(15), nullable=True)
    cattle_count: Mapped[int] = mapped_column(Integer, default=0)
    average_daily_yield_lpd: Mapped[float | None] = mapped_column(Float, nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_ifsc: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    milk_collections: Mapped[list[MilkCollection]] = relationship(
        "MilkCollection", back_populates="farmer", lazy="select"
    )


class MilkCollection(Base):
    __tablename__ = "milk_collections"

    collection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farmers.farmer_id", ondelete="CASCADE"), nullable=False
    )
    collection_date: Mapped[date] = mapped_column(Date, nullable=False)
    shift: Mapped[str] = mapped_column(String(10), default="morning")  # morning/evening
    quantity_litres: Mapped[float] = mapped_column(Float, nullable=False)
    fat_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    snf_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    rate_per_litre: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    total_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    farmer: Mapped[Farmer] = relationship("Farmer", back_populates="milk_collections")


class ProductBatch(Base):
    __tablename__ = "product_batches"

    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="SET NULL"), nullable=True
    )
    batch_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    product_type: Mapped[str] = mapped_column(String(100), nullable=False)  # milk/curd/ghee/etc
    quantity_litres: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    production_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    quality_grade: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class GovernmentScheme(Base):
    __tablename__ = "government_schemes"

    scheme_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scheme_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sponsoring_body: Mapped[str] = mapped_column(String(255), nullable=False)
    scheme_type: Mapped[str] = mapped_column(String(100), nullable=False)  # subsidy/loan/training/etc
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    eligibility_criteria: Mapped[str | None] = mapped_column(Text, nullable=True)
    benefit_amount_inr: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    benefit_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    application_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    valid_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_verified_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
