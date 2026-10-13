"""Regression coverage for configuration, health, setup and test isolation."""
import os
from pathlib import Path
import subprocess
import sys

import pytest

from app.config import BACKEND_DIR, Settings
from app.database import get_db
from app.main import app
from conftest import FakeSession, _get_candidate_pg_urls
from scripts import backend_setup


def test_backend_environment_path_does_not_depend_on_working_directory(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert Path(Settings.model_config["env_file"]) == BACKEND_DIR / ".env"
    result = subprocess.run(
        [sys.executable, "-c", "from app.config import settings; print(settings.APP_NAME)"],
        cwd=tmp_path, env={**os.environ, "PYTHONPATH": str(BACKEND_DIR)},
        capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stderr
    assert "CLEARPATH AI" in result.stdout


def test_database_urls_derive_sync_driver_without_losing_encoded_password():
    settings = Settings(_env_file=None, DATABASE_URL="postgresql+asyncpg://user:a%40b@localhost:55432/db")
    assert settings.SYNC_DATABASE_URL == "postgresql+psycopg2://user:a%40b@localhost:55432/db"


@pytest.mark.parametrize("url", ["sqlite:///:memory:", "mysql://user:password@localhost/db", "garbage"])
def test_no_alternate_database_fallback(url):
    with pytest.raises(ValueError):
        Settings(_env_file=None, DATABASE_URL=url)


def test_mismatched_sync_database_is_rejected():
    with pytest.raises(ValueError):
        Settings(_env_file=None, DATABASE_URL="postgresql+asyncpg://u:p@localhost/one",
                 SYNC_DATABASE_URL="postgresql://u:p@localhost/two")


def test_generated_environment_is_unique_and_existing_file_is_preserved(tmp_path, monkeypatch):
    monkeypatch.setattr(backend_setup, "BACKEND", tmp_path)
    backend_setup.init_env()
    first = (tmp_path / ".env").read_text()
    settings = Settings(_env_file=tmp_path / ".env")
    assert len(settings.JWT_SECRET_KEY) >= 32
    assert "change-this-local-password" not in first
    backend_setup.init_env()
    assert (tmp_path / ".env").read_text() == first


@pytest.mark.parametrize("path", ["/health", "/api/v1/health"])
def test_health_is_available_at_both_supported_paths(client, path):
    result = client.get(path)
    assert result.status_code == 200
    assert result.json()["database"] == "ok"


def test_failed_database_health_is_503_and_rolls_back_without_leaking_secrets(client):
    class BrokenSession(FakeSession):
        rolled_back = False

        async def execute(self, statement):
            raise RuntimeError("password=do-not-expose")

        async def rollback(self):
            self.rolled_back = True

    db = BrokenSession()
    app.dependency_overrides[get_db] = lambda: db
    response = client.get("/health")
    assert response.status_code == 503
    assert response.json()["database"] == "unreachable"
    assert "do-not-expose" not in response.text
    assert db.rolled_back


def test_database_tests_never_discover_application_database(monkeypatch):
    monkeypatch.delenv("TEST_DATABASE_URL", raising=False)
    assert _get_candidate_pg_urls() == []
    monkeypatch.setenv("TEST_DATABASE_URL", "postgresql://u:p@localhost/dairysetu_tn")
    with pytest.raises(ValueError, match="dedicated"):
        _get_candidate_pg_urls()


def test_setup_failure_is_nonzero_and_does_not_expose_connection_string():
    result = subprocess.run(
        [sys.executable, str(BACKEND_DIR / "scripts/backend_setup.py"), "--check"],
        env={**os.environ, "DATABASE_URL": "postgresql+asyncpg://u:hidden-test-password@127.0.0.1:1/clearpath_test",
             "SYNC_DATABASE_URL": ""},
        capture_output=True, text=True,
    )
    assert result.returncode == 1
    assert "Setup failed" in result.stderr
    assert "hidden-test-password" not in result.stderr
