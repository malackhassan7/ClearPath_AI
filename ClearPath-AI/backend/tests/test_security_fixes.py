"""Regression tests for the security audit: privilege escalation, data leaks, IDOR, fake data, secrets."""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.routing import APIRoute

from app.main import app
from app.models.dairy import Brand, FSSAIRule
from app.models.notification import AuditLog, Notification
from app.models.project import Application, ApplicationDocument, DocumentFlag, Project
from tests.conftest import FakeSession, make_user

NOW = datetime.now(timezone.utc)
API = "/api/v1"


# ───────────────────────── 1. self-registration can no longer grant admin/officer ─────────────────────────
@pytest.mark.parametrize("role", ["admin", "officer"])
def test_register_rejects_privileged_roles(client, role):
    r = client.post(f"{API}/auth/register", json={
        "full_name": "Mallory", "email": "mallory@example.com", "password": "Str0ng-Pass!", "role": role})
    assert r.status_code == 422


def test_register_still_works_for_normal_roles(client, as_user):
    db = as_user(None)
    r = client.post(f"{API}/auth/register", json={
        "full_name": "Anitha K", "email": "anitha@example.com", "password": "Str0ng-Pass!", "role": "farmer"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["user"]["role"] == "farmer"
    assert "password_hash" not in r.text
    assert db.added and db.added[0].password_hash != "Str0ng-Pass!"  # stored hashed


def test_only_an_admin_can_create_officer_accounts(client, as_user):
    payload = {"full_name": "New Officer", "email": "officer@example.com", "password": "Str0ng-Pass!", "role": "officer"}
    as_user(make_user("officer"))
    assert client.post(f"{API}/admin/users", json=payload).status_code == 403
    as_user(make_user("user"))
    assert client.post(f"{API}/admin/users", json=payload).status_code == 403
    db = as_user(make_user("admin"))
    r = client.post(f"{API}/admin/users", json=payload)
    assert r.status_code == 201, r.text
    assert r.json()["role"] == "officer"
    assert any(isinstance(o, AuditLog) and o.action == "USER_CREATED" for o in db.added)  # audited


def test_admin_cannot_change_own_role_or_lock_themselves_out(client, as_user):
    admin = make_user("admin")
    as_user(admin)
    r = client.put(f"{API}/admin/users/{admin.user_id}/role", json={"role": "user", "reason": "testing lockout"})
    assert r.status_code == 409
    assert client.put(f"{API}/admin/users/{admin.user_id}/status", params={"is_active": False}).status_code == 409


# ───────────────────────── 2. no endpoint may serialise password hashes / internal columns ─────────────────────────
def test_admin_users_never_returns_password_hash(client, as_user):
    users = [make_user("user"), make_user("farmer")]
    as_user(make_user("admin"), FakeSession(lambda sql: users if "FROM users" in sql else []))
    r = client.get(f"{API}/admin/users")
    assert r.status_code == 200
    assert len(r.json()) == 2
    assert "password_hash" not in r.text and "THIS_HASH_MUST_NEVER_BE_RETURNED" not in r.text


def test_audit_logs_hide_ip_and_user_agent(client, as_user):
    log = AuditLog(log_id=uuid.uuid4(), actor_id=uuid.uuid4(), action="X", entity_type="user", entity_id=uuid.uuid4(),
                   old_values={}, new_values={}, ip_address="203.0.113.7", user_agent="secret-agent", created_at=NOW)
    as_user(make_user("admin"), FakeSession(lambda sql: [log] if "audit_logs" in sql else []))
    r = client.get(f"{API}/admin/audit-logs")
    assert r.status_code == 200
    assert "203.0.113.7" not in r.text and "secret-agent" not in r.text and "ip_address" not in r.text


def test_notifications_only_expose_public_fields(client, as_user):
    me = make_user("user")
    n = Notification(notification_id=uuid.uuid4(), user_id=me.user_id, title="Hi", message="m", notification_type="info",
                     is_read=False, related_entity_type=None, related_entity_id=None, created_at=NOW)
    as_user(me, FakeSession(lambda sql: [n] if "notifications" in sql else []))
    r = client.get(f"{API}/notifications")
    assert r.status_code == 200
    assert set(r.json()[0]) == {"notification_id", "title", "message", "notification_type", "is_read",
                                "related_entity_type", "related_entity_id", "created_at"}


# ───────────────────────── 3/4. access control: unauthenticated and cross-user access ─────────────────────────
def _project(owner):
    return Project(project_id=uuid.uuid4(), created_by=owner.user_id, project_name="P", district="Salem", status="draft",
                   created_at=NOW, updated_at=NOW)


def test_rule_engine_requires_login(client):
    assert client.post(f"{API}/rule-engine/classify", json={"activity": "retail"}).status_code == 401
    assert client.get(f"{API}/rule-engine/district-suitability/SALEM").status_code == 401


def test_unauthenticated_validate_route_is_gone(client):
    assert client.post(f"{API}/rule-engine/validate-document/{uuid.uuid4()}").status_code in (401, 404, 405)


def test_other_users_cannot_list_or_create_applications_in_my_project(client, as_user):
    owner, intruder, officer = make_user("user"), make_user("user"), make_user("officer")
    project = _project(owner)
    db = FakeSession(lambda sql: [project] if "FROM projects" in sql else [], store=[project])
    as_user(intruder, db)
    assert client.get(f"{API}/projects/{project.project_id}/applications").status_code == 403
    assert client.post(f"{API}/projects/{project.project_id}/applications",
                       json={"project_id": str(project.project_id), "application_type": "FSSAI"}).status_code == 403
    as_user(officer, db)
    assert client.get(f"{API}/projects/{project.project_id}/applications").status_code == 200  # officers may read
    as_user(owner, db)
    assert client.get(f"{API}/projects/{project.project_id}/applications").status_code == 200


def _doc_world(owner):
    app_row = Application(application_id=uuid.uuid4(), project_id=uuid.uuid4(), applicant_id=owner.user_id,
                          application_type="FSSAI", status="draft", created_at=NOW, updated_at=NOW)
    doc = ApplicationDocument(document_id=uuid.uuid4(), application_id=app_row.application_id, document_name="Plan",
                              document_type="General", file_name="plan.pdf", file_url="uploads/x.pdf",
                              file_size_bytes=500, mime_type="application/pdf", upload_status="uploaded",
                              validation_status="pending", created_at=NOW)
    db = FakeSession(store=[doc, app_row])
    flags = lambda: [a for a in db.added if isinstance(a, DocumentFlag)]
    db.resolver = lambda sql: (
        [doc] if "FROM application_documents" in sql else
        [app_row] if "FROM applications" in sql else
        flags() if "FROM document_flags" in sql else [])
    return doc, db


def test_other_users_cannot_validate_or_read_flags_of_my_document(client, as_user):
    owner, intruder = make_user("user"), make_user("user")
    doc, db = _doc_world(owner)
    as_user(intruder, db)
    assert client.post(f"{API}/documents/{doc.document_id}/validate").status_code == 403
    assert client.get(f"{API}/documents/{doc.document_id}/flags").status_code == 403
    assert client.delete(f"{API}/documents/{doc.document_id}").status_code == 403


def test_missing_document_is_404_not_a_fake_result(client, as_user):
    as_user(make_user("user"), FakeSession())
    assert client.post(f"{API}/documents/{uuid.uuid4()}/validate").status_code == 404


def test_validation_is_honest_about_what_it_checked(client, as_user):
    owner = make_user("user")
    doc, db = _doc_world(owner)
    as_user(owner, db)
    r = client.post(f"{API}/documents/{doc.document_id}/validate")
    assert r.status_code == 200, r.text
    body = r.json()
    types = {f["flag_type"] for f in body["flags"]}
    assert "content_not_checked" in types
    assert "text / OCR readability" in body["checks_not_performed"]
    assert body["validation_status"] == "pending"  # never "passed" from structural checks alone
    assert "Murugan" not in r.text  # the old sample-data fallback


def test_only_admin_can_create_brands(client, as_user):
    body = {"brand_name": "Demo Brand", "brand_type": "private"}
    as_user(make_user("user"))
    assert client.post(f"{API}/brands/", json=body).status_code == 403
    as_user(make_user("officer"))
    assert client.post(f"{API}/brands/", json=body).status_code == 403
    as_user(make_user("admin"))
    assert client.post(f"{API}/brands/", json=body).status_code == 201


# ───────────────────────── route audit: nothing new can be added unprotected or untyped ─────────────────────────
PUBLIC = {  # intentionally reachable without a login
    ("GET", "/"), ("GET", "/health"), ("GET", "/api/v1/health"), ("GET", "/docs"), ("GET", "/redoc"), ("GET", "/openapi.json"),
    ("GET", "/docs/oauth2-redirect"),
    ("POST", f"{API}/auth/register"), ("POST", f"{API}/auth/login"), ("POST", f"{API}/auth/refresh"),
    ("POST", f"{API}/auth/logout"),
    ("GET", f"{API}/districts"), ("GET", f"{API}/districts/suitability-ranking"),
    ("GET", f"{API}/districts/{{district}}/milk-production"), ("GET", f"{API}/districts/{{district}}/suitability"),
    ("GET", f"{API}/schemes"), ("GET", f"{API}/schemes/{{scheme_id}}"),
    ("POST", f"{API}/chatbot/chat"), ("GET", f"{API}/chatbot/chat/stream"), ("GET", f"{API}/chatbot/conversations"),
}
UNTYPED_OK = PUBLIC | {  # return fixed status dicts or computed (non-database-object) results
    ("GET", "/api/v1/sources/versions/{version_id}/file"),  # authenticated immutable PDF bytes, not ORM serialization
    ("PUT", f"{API}/notifications/{{notification_id}}/read"), ("PUT", f"{API}/notifications/read-all"),
    ("POST", f"{API}/rule-engine/classify"), ("POST", f"{API}/rule-engine/fssai-rule"),
    ("POST", f"{API}/rule-engine/document-checklist"), ("POST", f"{API}/rule-engine/cost-estimate"),
    ("GET", f"{API}/rule-engine/district-suitability/{{district}}"),
}


def _routes():
    for r in app.routes:
        if isinstance(r, APIRoute):
            for m in r.methods - {"HEAD", "OPTIONS"}:
                yield m, r.path.rstrip("/") or "/", r


def _requires_login(dep) -> bool:
    return any(getattr(d.call, "__name__", "") == "get_current_user" or _requires_login(d) for d in dep.dependencies)


def test_every_non_public_route_requires_login():
    open_routes = [f"{m} {p}" for m, p, r in _routes() if (m, p) not in PUBLIC and not _requires_login(r.dependant)]
    assert open_routes == [], f"Routes reachable without login: {open_routes}"


def test_every_route_declares_a_response_schema():
    untyped = [f"{m} {p}" for m, p, r in _routes()
               if (m, p) not in UNTYPED_OK and r.response_model is None and r.status_code != 204]
    assert untyped == [], f"Routes without response_model (could leak ORM columns): {untyped}"


# ───────────────────────── 5. no invented fees/dates; rules come only from the database ─────────────────────────
def test_rule_engine_source_has_no_embedded_fees_or_verification_dates():
    src = Path("app/services/rule_engine.py").read_text(encoding="utf-8")
    assert "2024-01-01" not in src
    assert 'Decimal("' not in src
    assert "Murugan" not in src and "sample_fssai_doc" not in src
    assert "DEFAULT_BUSINESS_TYPES" not in src


async def test_get_fssai_rule_refuses_without_database_rows():
    from fastapi import HTTPException
    from app.services.rule_engine import get_fssai_rule
    with pytest.raises(HTTPException) as e:
        await get_fssai_rule("any", 400, 500000, db=None)
    assert e.value.status_code == 503
    with pytest.raises(HTTPException) as e:
        await get_fssai_rule("any", 400, 500000, db=FakeSession())
    assert e.value.status_code == 503


def _rule(tier, cap_lo=None, cap_hi=None, fee="1.00", status="unverified"):
    from decimal import Decimal
    return FSSAIRule(rule_id=uuid.uuid4(), business_type_id=uuid.uuid4(), license_tier=tier, license_form="Form X",
                     capacity_min_lpd=cap_lo, capacity_max_lpd=cap_hi, annual_fee_inr=Decimal(fee), rule_status=status,
                     validity_years=1, source_url="https://example.invalid/source", effective_date=None, last_verified_on=None)


@pytest.mark.parametrize("state", ["unverified", "needs_review", "verified", "disabled", "superseded"])
async def test_legacy_rules_without_versioned_provenance_never_produce_eligibility(state):
    from fastapi import HTTPException
    from app.services.rule_engine import get_fssai_rule
    rows = [_rule("registration", 0, 500, "11.00", state), _rule("state_license", 400, 5000, "22.00", state)]
    with pytest.raises(HTTPException) as exc:
        await get_fssai_rule("bt", 450, 0, db=FakeSession(lambda sql: rows))
    assert exc.value.status_code == 503


def test_structural_validation_never_pretends_to_read_content():
    from app.services.rule_engine import validate_document_structure
    ok = validate_document_structure("plan.pdf", 200_000, "application/pdf")
    assert {f["flag_type"] for f in ok} == {"content_not_checked"}
    bad = validate_document_structure("evil.exe", 200_000, "application/x-msdownload")
    assert any(f["flag_type"] == "invalid_file_format" and f["flag_severity"] == "error" for f in bad)
    big = validate_document_structure("big.pdf", 6 * 1024 * 1024, "application/pdf")
    assert any(f["flag_type"] == "file_size_exceeded" for f in big)


# ───────────────────────── 6. secrets ─────────────────────────
def test_placeholder_jwt_secret_is_refused_in_production_and_replaced_in_development():
    from app.config import Settings
    for weak in ("changeme", "change-this-secret-key-minimum-32-chars-long", "short"):
        with pytest.raises(ValueError):
            Settings(JWT_SECRET_KEY=weak, APP_ENV="production")
    dev = Settings(JWT_SECRET_KEY="changeme", APP_ENV="development")
    assert len(dev.JWT_SECRET_KEY) >= 32 and dev.JWT_SECRET_KEY != "changeme"
    strong = "x" * 40
    assert Settings(JWT_SECRET_KEY=strong, APP_ENV="production").JWT_SECRET_KEY == strong


def test_no_real_secrets_are_shipped_in_the_repo():
    root = Path(__file__).resolve().parents[1]
    import subprocess
    tracked = subprocess.run(["git", "ls-files", "--", str(root / ".env")], capture_output=True, text=True, check=True)
    assert not tracked.stdout.strip(), "backend/.env must not be committed"
    assert not (root / "data" / "auth.sqlite3").exists(), "legacy demo-user database must not ship"
    example = (root / ".env.example").read_text(encoding="utf-8")
    for line in example.splitlines():
        if re.match(r"(GROQ|GEMINI|DATA_GOV)_API_KEY=", line):
            assert re.search(r"your-|^\w+_API_KEY=$", line), f"looks like a real key: {line.split('=')[0]}"
