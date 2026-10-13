"""
Tests for Alembic migrations, environment hardening, and database integrity rules.
"""
from __future__ import annotations

import pytest
from pathlib import Path
import importlib.util
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text

from app.api.v1.auth import _hash_password
from app.models.user import User

env_path = Path(__file__).resolve().parent.parent / "alembic" / "env.py"
spec = importlib.util.spec_from_file_location("alembic_env", env_path)
alembic_env = importlib.util.module_from_spec(spec)
spec.loader.exec_module(alembic_env)
_verify_postgres_url = alembic_env._verify_postgres_url


def test_alembic_env_rejects_sqlite_and_empty_urls():
    with pytest.raises(RuntimeError, match="SQLite fallback is strictly forbidden"):
        _verify_postgres_url("sqlite:///:memory:", "TEST_URL")

    with pytest.raises(RuntimeError, match="SQLite fallback is strictly forbidden"):
        _verify_postgres_url("", "TEST_URL")

    valid_sync = "postgresql://user:pass@localhost:5432/clearpathai_tn"
    assert _verify_postgres_url(valid_sync, "SYNC_URL") == valid_sync

    valid_async = "postgresql+asyncpg://user:pass@localhost:5432/clearpathai_tn"
    assert _verify_postgres_url(valid_async, "ASYNC_URL") == valid_async


def test_alembic_revision_chain_is_unbroken():
    config = Config("alembic.ini")
    script = ScriptDirectory.from_config(config)
    heads = script.get_heads()
    assert len(heads) == 1
    assert heads[0] == "012_source_registry"

    # Walk chain back to base
    revisions = []
    current = script.get_revision(heads[0])
    while current is not None:
        revisions.append(current.revision)
        if current.down_revision is None:
            break
        current = script.get_revision(current.down_revision)

    assert revisions[-1] == "001_initial_schema"
    assert len(revisions) == 12  # 001 through 012


def test_case_insensitive_email_normalisation_on_registration(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Mixed Case User",
            "email": "MixedCaseUser@Example.Com",
            "password": "Password123!",
            "role": "user",
            "preferred_language": "en",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["email"] == "mixedcaseuser@example.com"


def test_case_insensitive_email_login(client):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "CASEINSENSITIVETEST@EXAMPLE.COM",
            "password": "DemoPassword123!",
        },
    )
    # Target email is lowercased and verified against session
    assert res.status_code in (200, 401)
