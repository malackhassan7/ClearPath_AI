"""
Tests for Phase 3 Deterministic Compliance Engine and Clearance Evaluation.
Validates fail-closed behavior, source grounding, activity isolation, and RBAC against PostgreSQL.
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool

from app.api.v1.auth import create_access_token
from app.database import get_db
from app.main import app
from app.models.project import Project
from app.models.user import User
from app.schemas.compliance import BusinessProfileInput
from app.services.compliance_engine import (
    evaluate_business_compliance,
    parse_project_activities,
)

pytestmark = pytest.mark.real_postgres


@pytest.fixture
async def compliance_async_session(real_async_pg_url: str):
    engine = create_async_engine(real_async_pg_url, poolclass=NullPool)
    async with engine.connect() as connection:
        transaction = await connection.begin()
        session_factory = async_sessionmaker(bind=connection, expire_on_commit=False)
        async with session_factory() as session:
            try:
                yield session
            finally:
                await session.close()
                await transaction.rollback()
    await engine.dispose()


@pytest.mark.asyncio
async def test_evaluate_profile_fails_closed_when_rules_are_draft(compliance_async_session: AsyncSession):
    """
    Asserts that candidate rules in DRAFT status refuse to issue an authoritative
    compliance conclusion or legal license tier.
    """
    profile = BusinessProfileInput(
        activities=["manufacturing"],
        capacity_lpd=1500,
        annual_turnover_inr=5_000_000,
        district="Coimbatore",
    )
    report = await evaluate_business_compliance(compliance_async_session, profile)

    assert report.is_authoritative is False
    assert report.evaluation_status == "PENDING_REGULATORY_REVIEW"
    assert report.suggested_fssai_tier is None
    assert "fail-closed" in report.tier_explanation.lower() or "withheld" in report.tier_explanation.lower()
    
    # Must match candidate manufacturing rules
    assert len(report.matched_rules) > 0
    for rule in report.matched_rules:
        assert rule.activity == "manufacturing"
        assert rule.applicability == "pending_review"
        assert rule.page_start >= 1
        assert rule.page_end >= rule.page_start
        assert len(rule.excerpt) > 0
        assert rule.source_title is not None

    # Required documents generated with review status
    assert len(report.required_documents) > 0
    for doc in report.required_documents:
        assert doc.review_status == "PENDING_OFFICER_REVIEW"
        assert doc.source_rule_key is not None
        assert doc.source_pages is not None


@pytest.mark.asyncio
async def test_activity_isolation_and_exclusion(compliance_async_session: AsyncSession):
    """
    Asserts that activities are isolated deterministically:
    a retail-only business excludes manufacturing rules.
    """
    profile_retail = BusinessProfileInput(activities=["retail"])
    report_retail = await evaluate_business_compliance(compliance_async_session, profile_retail)

    matched_activities = {r.activity for r in report_retail.matched_rules}
    assert matched_activities == {"retail"}
    
    # Manufacturing and distribution must be in excluded rules
    excluded_activities = {r.activity for r in report_retail.excluded_rules}
    assert "manufacturing" in excluded_activities or "distribution" in excluded_activities


@pytest.mark.asyncio
async def test_parse_project_activities_deterministic():
    """Validates activity keyword parsing is robust and deterministic."""
    p1 = Project(project_name="Dairy Processing Plant", notes="Chilling centre and processing")
    assert parse_project_activities(p1) == ["manufacturing"]

    p2 = Project(project_name="Aavin Milk Parlour", notes="Retail booth sales")
    assert parse_project_activities(p2) == ["retail"]

    p3 = Project(project_name="Integrated Dairy & Retail", notes="Milk chilling and retail parlour distribution")
    activities = parse_project_activities(p3)
    assert "manufacturing" in activities
    assert "retail" in activities
    assert "distribution" in activities


@pytest.mark.asyncio
async def test_project_compliance_endpoint_workflow(compliance_async_session: AsyncSession):
    """
    End-to-end integration test: creates a project via API, evaluates compliance,
    and validates access control and payload structure.
    """
    # 1. Create a persistent user in the transaction
    user = User(
        full_name="Fictional Applicant",
        email=f"applicant_{uuid.uuid4().hex[:8]}@example.com",
        role="user",
        password_hash="dummy_hash",
        is_active=True,
    )
    compliance_async_session.add(user)
    await compliance_async_session.flush()

    token = create_access_token(str(user.user_id), user.role)
    auth_headers = {"Authorization": f"Bearer {token}"}

    async def override_get_db():
        yield compliance_async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 2. Create a project
            proj_res = await client.post(
                "/api/v1/projects/",
                headers=auth_headers,
                json={
                    "project_name": "Coimbatore Dairy Processing",
                    "district": "Coimbatore",
                    "capacity_lpd": 2500,
                    "annual_turnover": 4500000,
                    "notes": "processing_unit",
                },
            )
            assert proj_res.status_code == 201
            project_id = proj_res.json()["project_id"]

            # 3. Get compliance evaluation for this project
            eval_res = await client.get(
                f"/api/v1/projects/{project_id}/compliance-evaluation",
                headers=auth_headers,
            )
            assert eval_res.status_code == 200
            data = eval_res.json()

            assert data["project_id"] == project_id
            assert data["evaluation_status"] == "PENDING_REGULATORY_REVIEW"
            assert data["is_authoritative"] is False
            assert data["suggested_fssai_tier"] is None
            assert len(data["matched_rules"]) > 0
            assert len(data["required_documents"]) > 0

            # 4. Unauthenticated request rejected
            unauth_res = await client.get(
                f"/api/v1/projects/{project_id}/compliance-evaluation",
            )
            assert unauth_res.status_code == 401

            # 5. Non-existent project returns 404
            missing_id = str(uuid.uuid4())
            missing_res = await client.get(
                f"/api/v1/projects/{missing_id}/compliance-evaluation",
                headers=auth_headers,
            )
            assert missing_res.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db, None)
