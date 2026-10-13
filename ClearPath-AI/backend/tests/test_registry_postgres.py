"""Phase 2 API/authorization/audit tests on a newly migrated disposable database."""
import asyncio
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

from app.api.v1.auth import create_access_token
from app.database import get_db
from app.main import app
from app.models.user import User

pytestmark = pytest.mark.real_postgres
BACKEND = Path(__file__).resolve().parents[1]
PDF = BACKEND.parent / "reference/KindofBusinessEligibility_261012_161357.pdf"


@pytest.fixture(scope="module")
def registry_database(real_pg_url):
    name = f"registry_{uuid.uuid4().hex}_test"
    admin = create_engine(real_pg_url, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{name}"'))
    url = make_url(real_pg_url).set(database=name)
    sync_url = url.set(drivername="postgresql+psycopg2").render_as_string(hide_password=False)
    async_url = url.set(drivername="postgresql+asyncpg").render_as_string(hide_password=False)
    engine = create_engine(sync_url)
    try:
        result = subprocess.run([sys.executable, "scripts/backend_setup.py", "--migrate"], cwd=BACKEND,
            env={**os.environ, "DATABASE_URL":async_url, "SYNC_DATABASE_URL":sync_url}, capture_output=True, text=True, timeout=60)
        assert result.returncode == 0, result.stderr
        tokens = {}
        with Session(engine) as db:
            for label, role in [("author","admin"), ("reviewer","officer"), ("reader","user")]:
                user = User(full_name=f"Fictional {label}", email=f"{label}@example.com", role=role, password_hash="unused")
                db.add(user); db.flush()
                tokens[label] = {"Authorization":"Bearer " + create_access_token(str(user.user_id), role)}
            db.commit()
        yield engine, async_url, tokens
    finally:
        engine.dispose()
        with admin.connect() as conn:
            conn.execute(text(f'DROP DATABASE "{name}" WITH (FORCE)'))
        admin.dispose()


@pytest.fixture
def registry_client(registry_database):
    engine, url, tokens = registry_database
    async_engine = create_async_engine(url, poolclass=NullPool)
    factory = async_sessionmaker(async_engine, expire_on_commit=False)
    async def session():
        async with factory() as db:
            try:
                yield db
                await db.commit()
            except Exception:
                await db.rollback()
                raise
    app.dependency_overrides[get_db] = session
    try:
        with TestClient(app) as client:
            yield client, engine, tokens
    finally:
        app.dependency_overrides.clear()
        asyncio.run(async_engine.dispose())


def upload(client, tokens, key=None, **metadata):
    key = key or "evidence-" + uuid.uuid4().hex
    body = {"title":"Fictional test evidence metadata", "issuer":"Test fixture",
            "provenance_note":"Test-only provenance; not an actual regulatory review.", **metadata}
    response = client.post(f"/api/v1/sources/{key}/versions", headers=tokens["author"],
        data={"metadata":json.dumps(body)}, files={"file":("reference.pdf",PDF.read_bytes(),"application/pdf")})
    assert response.status_code == 201, response.text
    return response.json()


def review(client, tokens, kind, item, state, actor="reviewer", expected=None):
    path = f"/sources/versions/{item['id']}" if kind == "source" else f"/registry/rules/{item['id']}"
    return client.post("/api/v1" + path + "/review", headers=tokens[actor], json={
        "expected_state":expected or item["state"], "state":state, "reason":"Fictional test review with explicit rationale."})


def make_rule(client, tokens, source, **overrides):
    page = client.get(f"/api/v1/sources/versions/{source['id']}/pages/1", headers=tokens["reader"]).json()
    body = {"rule_key":"draft-" + uuid.uuid4().hex, "activity":"manufacturing", "kind":"eligibility",
            "source_version_id":source["id"], "title":"Test evidence passage", "page_start":1, "page_end":1,
            "excerpt":page["text"], **overrides}
    return client.post("/api/v1/registry/rules", headers=tokens["author"], json=body)


def verified_source(client, tokens):
    source = upload(client, tokens, canonical_url="https://example.invalid/test.pdf", retrieved_at="2020-01-01T00:00:00Z")
    response = review(client,tokens,"source",source,"VERIFIED")
    assert response.status_code == 200, response.text
    return response.json()


def test_provenance_idempotency_and_corrected_metadata_are_versioned(registry_client):
    client, engine, tokens = registry_client
    source = upload(client,tokens)
    assert source["state"] == "NEEDS_REVIEW" and source["retrieved_at"] is None
    assert source["sha256"] == hashlib.sha256(PDF.read_bytes()).hexdigest()
    assert source["received_at"] and source["page_count"] == 10
    assert "content" not in source and "pages" not in source
    download = client.get(f"/api/v1/sources/versions/{source['id']}/file", headers=tokens["reader"])
    assert download.status_code == 200 and download.content == PDF.read_bytes()
    assert download.headers["X-Content-SHA256"] == source["sha256"]
    assert client.get(f"/api/v1/sources/versions/{source['id']}/file").status_code == 401
    same = upload(client,tokens,key=source["source_key"])
    assert same["id"] == source["id"]
    corrected = upload(client,tokens,key=source["source_key"],canonical_url="https://example.invalid/source.pdf")
    assert corrected["version"] == 2 and corrected["sha256"] == source["sha256"]
    assert corrected["id"] != source["id"]
    assert review(client,tokens,"source",source,"VERIFIED").status_code == 409
    with engine.connect() as conn:
        count = conn.execute(text("SELECT count(*) FROM audit_logs WHERE action='SOURCE_IMPORTED' AND entity_id=:id"),{"id":source["id"]}).scalar()
        assert count == 1


def test_evidence_is_immutable_in_database(registry_client):
    client, engine, tokens = registry_client
    source = upload(client,tokens)
    for statement in ["UPDATE source_versions SET sha256='tampered' WHERE id=:id", "DELETE FROM source_versions WHERE id=:id"]:
        with pytest.raises(Exception, match="immutable|cannot be deleted"):
            with engine.begin() as conn:
                conn.execute(text(statement),{"id":source["id"]})


def test_page_citation_validation_activity_and_authorization(registry_client):
    client, engine, tokens = registry_client
    source = upload(client,tokens)
    assert make_rule(client,tokens,source,page_end=999).status_code == 422
    assert make_rule(client,tokens,source,excerpt="Invented passage with no supporting page evidence.").status_code == 422
    assert make_rule(client,tokens,source,activity="all").status_code == 422
    records=[]
    for activity in ["manufacturing","retail","distribution"]:
        response=make_rule(client,tokens,source,activity=activity)
        assert response.status_code == 201, response.text
        records.append(response.json())
    response=client.get("/api/v1/registry/rules?activity=retail",headers=tokens["reader"])
    assert all(r["activity"] == "retail" for r in response.json())
    assert client.post(f"/api/v1/sources/no-access/versions", headers=tokens["reader"],data={"metadata":"{}"},files={"file":("a.pdf",PDF.read_bytes())}).status_code == 403
    assert review(client,tokens,"rule",records[0],"NEEDS_REVIEW",actor="reader").status_code == 403
    assert client.get(f"/api/v1/sources/versions/{source['id']}/pages/11",headers=tokens["reader"]).status_code == 404


def test_review_transitions_source_revocation_and_audit(registry_client):
    client, engine, tokens = registry_client
    source = verified_source(client,tokens)
    draft = make_rule(client,tokens,source).json()
    assert review(client,tokens,"rule",draft,"VERIFIED").status_code == 409
    pending = review(client,tokens,"rule",draft,"NEEDS_REVIEW").json()
    assert review(client,tokens,"rule",pending,"VERIFIED",actor="author").status_code == 403
    assert review(client,tokens,"rule",pending,"VERIFIED",expected="DRAFT").status_code == 409
    approved = review(client,tokens,"rule",pending,"VERIFIED")
    assert approved.status_code == 200, approved.text
    assert approved.json()["reviewed_by"] and approved.json()["reviewed_at"]
    assert review(client,tokens,"source",source,"DISABLED").status_code == 200
    rules=client.get("/api/v1/registry/rules",headers=tokens["reader"]).json()
    changed=next(r for r in rules if r["id"]==draft["id"])
    assert changed["state"]=="NEEDS_REVIEW"
    assert review(client,tokens,"rule",changed,"VERIFIED").status_code == 409
    with engine.connect() as conn:
        events=conn.execute(text("SELECT action FROM audit_logs WHERE entity_id=:id"),{"id":draft["id"]}).scalars().all()
        assert "RULE_DRAFTED" in events and "REGISTRY_REVIEW" in events and "SOURCE_REVIEW_INVALIDATED_RULE" in events


def test_conflicts_prevent_verification_and_resolution_does_not_auto_verify(registry_client):
    client, engine, tokens = registry_client
    source=verified_source(client,tokens)
    draft=make_rule(client,tokens,source,conflict_note="Fictional contradictory publication needs review.").json()
    pending=review(client,tokens,"rule",draft,"NEEDS_REVIEW").json()
    assert review(client,tokens,"rule",pending,"VERIFIED").status_code == 409
    clear=client.post(f"/api/v1/registry/rules/{draft['id']}/conflict",headers=tokens["reviewer"],json={"conflict_note":None,"reason":"Fictional documented resolution for regression test."})
    assert clear.status_code == 200 and clear.json()["state"]=="NEEDS_REVIEW"
    approved=review(client,tokens,"rule",clear.json(),"VERIFIED").json()
    assert approved["state"]=="VERIFIED"
    newer=make_rule(client,tokens,source,rule_key=draft["rule_key"]).json()
    newer=review(client,tokens,"rule",newer,"NEEDS_REVIEW").json()
    assert review(client,tokens,"rule",newer,"VERIFIED").status_code == 409
    superseded=review(client,tokens,"rule",approved,"SUPERSEDED").json()
    assert review(client,tokens,"rule",superseded,"NEEDS_REVIEW").status_code == 409
    assert review(client,tokens,"rule",newer,"VERIFIED").status_code == 200


def test_importer_preserves_three_documents_and_nine_separate_drafts(registry_database):
    engine,url,tokens=registry_database
    sync_url=engine.url.render_as_string(hide_password=False)
    env={**os.environ,"DATABASE_URL":url,"SYNC_DATABASE_URL":sync_url}
    for _ in range(2):
        result=subprocess.run([sys.executable,"scripts/import_reference_sources.py"],cwd=BACKEND,env=env,capture_output=True,text=True,timeout=60)
        assert result.returncode == 0, result.stderr
    with engine.connect() as conn:
        sources=conn.execute(text("SELECT * FROM source_versions WHERE source_key IN ('fssai-eligibility','fssai-kob-documents','supplied-form-a')")).mappings().all()
        assert len(sources)==3 and all(s["state"]=="NEEDS_REVIEW" for s in sources)
        assert all(s["retrieved_at"] is None for s in sources)
        drafts=conn.execute(text("SELECT r.* FROM registry_rules r JOIN source_versions s ON s.id=r.source_version_id WHERE s.source_key IN ('fssai-eligibility','fssai-kob-documents','supplied-form-a')")).mappings().all()
        assert len(drafts)==9 and all(r["state"]=="DRAFT" for r in drafts)
        assert {r["activity"] for r in drafts}=={"manufacturing","retail","distribution"}


def test_new_conflicting_version_invalidates_earlier_review(registry_client):
    client,engine,tokens=registry_client
    source=verified_source(client,tokens)
    draft=make_rule(client,tokens,source).json()
    pending=review(client,tokens,"rule",draft,"NEEDS_REVIEW").json()
    assert review(client,tokens,"rule",pending,"VERIFIED").status_code==200
    newer=upload(client,tokens,key=source["source_key"],conflict_note="Newly reported contradiction needs human investigation.")
    sources=client.get("/api/v1/sources",headers=tokens["reader"]).json()
    old=next(s for s in sources if s["id"]==source["id"])
    assert old["state"]=="NEEDS_REVIEW"
    rules=client.get("/api/v1/registry/rules",headers=tokens["reader"]).json()
    assert next(r for r in rules if r["id"]==draft["id"])["state"]=="NEEDS_REVIEW"
    assert review(client,tokens,"source",old,"VERIFIED").status_code==409


def test_phase2_seven_minimum_verification_gates(registry_client):
    """Explicitly verify the 7 minimum Phase 2 requirements on live PostgreSQL."""
    client, engine, tokens = registry_client

    # 1. Missing or unverified provenance prevents verification
    source_no_url = upload(client, tokens)  # canonical_url=None, retrieved_at=None
    res1 = review(client, tokens, "source", source_no_url, "VERIFIED")
    assert res1.status_code == 409
    assert "Verification requires an original retrieval date and canonical source URL" in res1.text

    # 2. An unauthorized user cannot approve a rule
    good_source = verified_source(client, tokens)
    draft_rule = make_rule(client, tokens, good_source).json()
    pending_rule = review(client, tokens, "rule", draft_rule, "NEEDS_REVIEW").json()
    # 2a. Reader role cannot approve (403)
    res2a = review(client, tokens, "rule", pending_rule, "VERIFIED", actor="reader")
    assert res2a.status_code == 403
    # 2b. Author cannot approve own drafted rule (403 separation of duties)
    res2b = review(client, tokens, "rule", pending_rule, "VERIFIED", actor="author")
    assert res2b.status_code == 403

    # 3. Required review evidence cannot be bypassed (< 10 chars returns 422)
    res3 = client.post(f"/api/v1/registry/rules/{pending_rule['id']}/review", headers=tokens["reviewer"], json={
        "expected_state": "NEEDS_REVIEW", "state": "VERIFIED", "reason": "too short"
    })
    assert res3.status_code == 422

    # 4. Conflicts cannot leave a stale rule authoritative
    res_app = review(client, tokens, "rule", pending_rule, "VERIFIED", actor="reviewer")
    assert res_app.status_code == 200
    # Flag conflict on rule: drops state to NEEDS_REVIEW
    res_conf = client.post(f"/api/v1/registry/rules/{pending_rule['id']}/conflict", headers=tokens["reviewer"], json={
        "conflict_note": "Conflicting gazette notification reported", "reason": "Validating conflict invalidation"
    })
    assert res_conf.status_code == 200
    assert res_conf.json()["state"] == "NEEDS_REVIEW"
    # Cannot be verified while conflict is unresolved
    res_reapprove = review(client, tokens, "rule", res_conf.json(), "VERIFIED", actor="reviewer")
    assert res_reapprove.status_code == 409

    # 5. Unverified or inapplicable rules cannot produce authoritative compliance results or chatbot citations
    res5 = client.get("/api/v1/chatbot/chat/stream", params={"q": "solar panel tariff calculation", "activity": "distribution"})
    assert res5.status_code == 200
    assert '"sources": []' in res5.text

    # 6. Unknown dates remain unknown (published_on, effective_on, retrieved_at are null, not synthesized)
    source_record = client.get(f"/api/v1/sources/versions/{source_no_url['id']}", headers=tokens["reader"]).json()
    assert source_record["published_on"] is None
    assert source_record["effective_on"] is None
    assert source_record["retrieved_at"] is None
    assert source_record["received_at"] is not None

    # 7. Existing source-version immutability and audit history remain intact
    with pytest.raises(Exception, match="immutable|cannot be deleted"):
        with engine.begin() as conn:
            conn.execute(text("UPDATE source_versions SET title='Tampered' WHERE id=:id"), {"id": source_no_url["id"]})
    with engine.connect() as conn:
        audit_count = conn.execute(
            text("SELECT count(*) FROM audit_logs WHERE entity_id=:id"), {"id": pending_rule["id"]}
        ).scalar()
        assert audit_count >= 2

