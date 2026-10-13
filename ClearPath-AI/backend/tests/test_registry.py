import uuid
from io import BytesIO

import pytest
from fastapi import HTTPException
from pypdf import PdfWriter

from app.schemas.registry import RuleCreate, ReviewRequest
from app.services.registry import parse_pdf, MAX_BYTES
from conftest import make_user, FakeSession


@pytest.mark.parametrize("content", [b"fake pdf", b"%PDF-1.4\nnot a real file"])
def test_registry_rejects_forged_pdf(content):
    with pytest.raises(HTTPException) as exc:
        parse_pdf(content)
    assert exc.value.status_code == 422


def test_registry_rejects_oversized_and_encrypted_pdf():
    with pytest.raises(HTTPException) as exc:
        parse_pdf(b"%PDF-1.4" + b"x" * MAX_BYTES)
    assert exc.value.status_code == 413
    pdf = PdfWriter(); pdf.add_blank_page(100, 100); pdf.encrypt("secret")
    output = BytesIO(); pdf.write(output)
    with pytest.raises(HTTPException):
        parse_pdf(output.getvalue())


def test_states_and_activities_are_not_free_text():
    with pytest.raises(ValueError):
        ReviewRequest(expected_state="DRAFT", state="APPROVED", reason="Not a valid registry state")
    with pytest.raises(ValueError):
        RuleCreate(rule_key="example", activity="all", kind="eligibility", source_version_id=uuid.uuid4(),
                   title="An example", page_start=1, page_end=1, excerpt="Some evidence")


@pytest.mark.parametrize("path", ["/api/v1/sources", "/api/v1/registry/rules"])
def test_registry_requires_authentication(client, path):
    assert client.get(path).status_code == 401


@pytest.mark.parametrize("path", [
    "/api/v1/sources/versions/00000000-0000-0000-0000-000000000001",
    "/api/v1/registry/rules/00000000-0000-0000-0000-000000000002",
])
def test_single_record_get_requires_authentication(client, path):
    """GET /sources/versions/{id} and /registry/rules/{id} require authentication."""
    assert client.get(path).status_code == 401


def test_single_record_get_returns_404_for_unknown_id(client, as_user):
    """Authenticated users receive 404 for unknown source/rule IDs, not an empty body."""
    as_user(make_user())
    assert client.get(f"/api/v1/sources/versions/{uuid.uuid4()}").status_code == 404
    assert client.get(f"/api/v1/registry/rules/{uuid.uuid4()}").status_code == 404


@pytest.mark.parametrize("role", ["user", "farmer", "entrepreneur", "consultant"])
def test_unprivileged_users_cannot_review_or_resolve_conflicts(client, as_user, role):
    as_user(make_user(role))
    for path in [f"/api/v1/sources/versions/{uuid.uuid4()}", f"/api/v1/registry/rules/{uuid.uuid4()}"]:
        assert client.post(path + "/review", json={"expected_state":"NEEDS_REVIEW", "state":"VERIFIED", "reason":"Attempted unauthorized review"}).status_code == 403
        assert client.post(path + "/conflict", json={"conflict_note":None, "reason":"Attempted unauthorized resolution"}).status_code == 403


def test_project_checklist_does_not_infer_a_tier_from_capacity(client, as_user):
    from app.models.project import Project
    owner = make_user()
    project = Project(project_id=uuid.uuid4(), created_by=owner.user_id, capacity_lpd=60000)
    db = FakeSession(lambda sql: [project])
    as_user(owner, db)
    assert client.get(f"/api/v1/documents/required/{project.project_id}").status_code == 503
    as_user(make_user(), db)
    assert client.get(f"/api/v1/documents/required/{project.project_id}").status_code == 403


def test_streaming_chat_does_not_bypass_review_gate(client):
    response = client.get("/api/v1/chatbot/chat/stream", params={"q":"FSSAI fee for 20,000 litres/day"})
    assert response.status_code == 200
    assert '"sources": []' in response.text
    assert "3,000" not in response.text
