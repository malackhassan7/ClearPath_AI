"""
Tests for backend/scripts/db_preflight.py
Verifies that preflight detection identifies violations without modifying any rows.
"""
from __future__ import annotations

import tempfile
import uuid
from pathlib import Path

import pytest
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Float,
    ForeignKey,
    Integer,
    MetaData,
    Numeric,
    String,
    Table,
    Text,
    create_engine,
    insert,
)

from scripts.db_preflight import run_preflight


@pytest.fixture
def dirty_sqlite_engine():
    """Create a minimal SQLite schema matching the legacy tables and insert dirty data."""
    engine = create_engine("sqlite:///:memory:")
    meta = MetaData()

    users = Table(
        "users",
        meta,
        Column("user_id", String, primary_key=True),
        Column("full_name", String),
        Column("email", String),
        Column("role", String),
        Column("is_active", Boolean, default=True),
    )

    applications = Table(
        "applications",
        meta,
        Column("application_id", String, primary_key=True),
        Column("status", String),
        Column("license_tier", String),
    )

    projects = Table(
        "projects",
        meta,
        Column("project_id", String, primary_key=True),
        Column("status", String),
    )

    grievances = Table(
        "grievances",
        meta,
        Column("grievance_id", String, primary_key=True),
        Column("status", String),
        Column("priority", String),
    )

    application_documents = Table(
        "application_documents",
        meta,
        Column("document_id", String, primary_key=True),
        Column("file_url", String),
        Column("upload_status", String),
        Column("validation_status", String),
    )

    notifications = Table(
        "notifications",
        meta,
        Column("notification_id", String, primary_key=True),
        Column("notification_type", String),
    )

    fssai_rules = Table(
        "fssai_rules",
        meta,
        Column("rule_id", String, primary_key=True),
        Column("rule_status", String),
    )

    user_organizations = Table(
        "user_organizations",
        meta,
        Column("id", String, primary_key=True),
        Column("user_id", String),
        Column("organization_id", String),
    )

    district_milk_production = Table(
        "district_milk_production",
        meta,
        Column("record_id", String, primary_key=True),
        Column("district", String),
        Column("year", String),
    )

    brand_requirements = Table(
        "brand_requirements",
        meta,
        Column("requirement_id", String, primary_key=True),
        Column("brand_id", String),
        Column("requirement_name", String),
    )

    meta.create_all(engine)

    with engine.begin() as conn:
        # 1. Case-duplicate emails
        conn.execute(
            insert(users),
            [
                {"user_id": "u1", "full_name": "A", "email": "dup@example.com", "role": "user"},
                {"user_id": "u2", "full_name": "B", "email": "DUP@EXAMPLE.COM", "role": "user"},
                {"user_id": "u3", "full_name": "C", "email": "bad@example.com", "role": "invalid_superadmin"},
            ],
        )

        # 2. Invalid application status and license tier
        conn.execute(
            insert(applications),
            [
                {"application_id": "app1", "status": "odd_status", "license_tier": "registration"},
                {"application_id": "app2", "status": "draft", "license_tier": "unsupported_tier"},
            ],
        )

        # 3. Invalid project status
        conn.execute(insert(projects), [{"project_id": "p1", "status": "corrupt_proj_status"}])

        # 4. Invalid grievance
        conn.execute(
            insert(grievances),
            [{"grievance_id": "g1", "status": "bad_status", "priority": "bad_priority"}],
        )

        # 5. Invalid document status and missing file
        conn.execute(
            insert(application_documents),
            [
                {
                    "document_id": "doc1",
                    "file_url": "nonexistent_file.pdf",
                    "upload_status": "bad_upload",
                    "validation_status": "bad_validation",
                }
            ],
        )

        # 6. Duplicate user_organizations
        conn.execute(
            insert(user_organizations),
            [
                {"id": "uo1", "user_id": "u1", "organization_id": "org1"},
                {"id": "uo2", "user_id": "u1", "organization_id": "org1"},
            ],
        )

        # 7. Duplicate district_milk_production
        conn.execute(
            insert(district_milk_production),
            [
                {"record_id": "d1", "district": "Salem", "year": "2018-19"},
                {"record_id": "d2", "district": "Salem", "year": "2018-19"},
            ],
        )

    return engine


def test_preflight_detects_all_dirty_data_categories(dirty_sqlite_engine):
    with tempfile.TemporaryDirectory() as tmpdir:
        report = run_preflight(dirty_sqlite_engine, upload_dir=tmpdir)
        assert report.has_violations

        categories = {v["category"] for v in report.violations}
        assert "Case-Duplicate Emails" in categories
        assert "Invalid users.role" in categories
        assert "Invalid applications.status" in categories
        assert "Invalid applications.license_tier" in categories
        assert "Invalid projects.status" in categories
        assert "Invalid grievances status/priority" in categories
        assert "Invalid application_documents statuses" in categories
        assert "Duplicate user_organizations" in categories
        assert "Duplicate district_milk_production" in categories
        assert "Missing Files on Disk" in categories


def test_preflight_clean_database_passes():
    engine = create_engine("sqlite:///:memory:")
    meta = MetaData()
    users = Table(
        "users",
        meta,
        Column("user_id", String, primary_key=True),
        Column("email", String),
        Column("role", String),
    )
    meta.create_all(engine)

    with engine.begin() as conn:
        conn.execute(
            insert(users),
            [
                {"user_id": "u1", "email": "valid1@example.com", "role": "user"},
                {"user_id": "u2", "email": "valid2@example.com", "role": "officer"},
            ],
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        report = run_preflight(engine, upload_dir=tmpdir)
        assert not report.has_violations
