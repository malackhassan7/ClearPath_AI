"""
Project, Application, ApplicationDocument, DocumentFlag,
ApplicationReview, and ApplicationStatusHistory ORM models.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'active', 'completed', 'abandoned')",
            name="ck_projects_status",
        ),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.organization_id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    business_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_types.business_type_id", ondelete="SET NULL"),
        nullable=True,
    )
    brand_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="SET NULL"), nullable=True
    )
    capacity_lpd: Mapped[float | None] = mapped_column(Float, nullable=True)
    annual_turnover: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="draft")  # draft/active/completed/abandoned
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="projects")  # noqa: F821
    business_type: Mapped["BusinessType"] = relationship("BusinessType", back_populates="projects")  # noqa: F821
    brand: Mapped["Brand"] = relationship("Brand", back_populates="projects")  # noqa: F821
    applications: Mapped[list[Application]] = relationship(
        "Application", back_populates="project", lazy="select"
    )


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'returned', 'attention_needed')",
            name="ck_applications_status",
        ),
        CheckConstraint(
            "license_tier IS NULL OR license_tier IN ('registration', 'state_license', 'central_license')",
            name="ck_applications_license_tier",
        ),
    )

    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False
    )
    applicant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    application_type: Mapped[str] = mapped_column(String(100), nullable=False)  # FSSAI/brand/other
    license_tier: Mapped[str | None] = mapped_column(String(50), nullable=True)  # registration/state/central
    status: Mapped[str] = mapped_column(String(30), default="draft")
    # draft/submitted/under_review/approved/rejected/returned
    submission_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fssai_rule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("fssai_rules.rule_id", ondelete="SET NULL"), nullable=True
    )
    estimated_fee_inr: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped[Project] = relationship("Project", back_populates="applications")
    documents: Mapped[list[ApplicationDocument]] = relationship(
        "ApplicationDocument", back_populates="application", lazy="select"
    )
    reviews: Mapped[list[ApplicationReview]] = relationship(
        "ApplicationReview", back_populates="application", lazy="select"
    )
    status_history: Mapped[list[ApplicationStatusHistory]] = relationship(
        "ApplicationStatusHistory", back_populates="application", lazy="select"
    )


class ApplicationDocument(Base):
    __tablename__ = "application_documents"
    __table_args__ = (
        CheckConstraint(
            "upload_status IN ('uploaded', 'processing', 'verified', 'failed')",
            name="ck_application_documents_upload_status",
        ),
        CheckConstraint(
            "validation_status IN ('pending', 'passed', 'warning', 'failed')",
            name="ck_application_documents_validation_status",
        ),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.application_id", ondelete="CASCADE"),
        nullable=False,
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    upload_status: Mapped[str] = mapped_column(String(30), default="uploaded")  # uploaded/processing/verified/failed
    validation_status: Mapped[str] = mapped_column(String(30), default="pending")  # pending/passed/warning/failed
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    application: Mapped[Application] = relationship("Application", back_populates="documents")
    flags: Mapped[list[DocumentFlag]] = relationship(
        "DocumentFlag", back_populates="document", lazy="select"
    )


class DocumentFlag(Base):
    __tablename__ = "document_flags"

    flag_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("application_documents.document_id", ondelete="CASCADE"),
        nullable=False,
    )
    flag_type: Mapped[str] = mapped_column(String(100), nullable=False)  # format/size/readability/expiry/consistency
    flag_severity: Mapped[str] = mapped_column(String(20), nullable=False)  # info/warning/error
    flag_message: Mapped[str] = mapped_column(Text, nullable=False)
    auto_detected: Mapped[bool] = mapped_column(Boolean, default=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    document: Mapped[ApplicationDocument] = relationship("ApplicationDocument", back_populates="flags")


class ApplicationReview(Base):
    __tablename__ = "application_reviews"

    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.application_id", ondelete="CASCADE"),
        nullable=False,
    )
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    decision: Mapped[str] = mapped_column(String(30), nullable=False)  # approve/reject/return
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    checklist: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    application: Mapped[Application] = relationship("Application", back_populates="reviews")


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    history_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.application_id", ondelete="CASCADE"),
        nullable=False,
    )
    changed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    old_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    application: Mapped[Application] = relationship("Application", back_populates="status_history")
