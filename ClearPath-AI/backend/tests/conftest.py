"""Shared fixtures: an in-memory fake database session and a FastAPI test client.

No PostgreSQL is needed. The fake session returns whatever rows a test's resolver supplies, and applies
column defaults on flush() so response schemas see realistic objects. Tests that need a real database
(migrations, constraints) are separate and require Docker.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable

import pytest
from fastapi.testclient import TestClient

from app.api.v1.auth import get_current_user
from app.database import get_db
from app.main import app
from app.models.user import User


class FakeResult:
    def __init__(self, rows: list[Any]):
        self._rows = list(rows)

    def scalars(self) -> "FakeResult":
        return self

    def all(self) -> list[Any]:
        return list(self._rows)

    def first(self) -> Any:
        return self._rows[0] if self._rows else None

    def scalar_one_or_none(self) -> Any:
        return self._rows[0] if self._rows else None


class FakeSession:
    """Minimal AsyncSession stand-in. `resolver(sql_text)` returns the rows for a statement."""

    def __init__(self, resolver: Callable[[str], list[Any]] | None = None, store: list[Any] | None = None):
        self.resolver = resolver or (lambda sql: [])
        self.store = store or []  # objects db.get() can find by primary key
        self.added: list[Any] = []

    async def execute(self, stmt: Any) -> FakeResult:
        sql = str(stmt)
        return FakeResult(self.resolver(sql))

    async def get(self, model: type, pk: Any) -> Any:
        for obj in self.store:
            if isinstance(obj, model):
                key = model.__mapper__.primary_key[0].key
                if getattr(obj, key) == pk:
                    return obj
        return None

    def add(self, obj: Any) -> None:
        self.added.append(obj)

    async def flush(self) -> None:
        now = datetime.now(timezone.utc)
        for obj in self.added:
            for col in obj.__table__.columns:
                if getattr(obj, col.key, None) is not None:
                    continue
                if col.default is not None:
                    arg = col.default.arg
                    setattr(obj, col.key, arg(None) if callable(arg) else arg)
                elif col.key in ("created_at", "updated_at"):
                    setattr(obj, col.key, now)
        self.store.extend(o for o in self.added if o not in self.store)

    async def commit(self) -> None:
        await self.flush()

    async def refresh(self, obj: Any) -> None:
        return None


def make_user(role: str = "user", **kw: Any) -> User:
    now = datetime.now(timezone.utc)
    defaults = dict(
        user_id=uuid.uuid4(), full_name="Test Person", email=f"{role}-{uuid.uuid4().hex[:6]}@example.com",
        phone=None, password_hash="$2b$12$THIS_HASH_MUST_NEVER_BE_RETURNED", role=role,
        preferred_language="en", is_active=True, email_verified=False, created_at=now, updated_at=now,
    )
    defaults.update(kw)
    return User(**defaults)


@pytest.fixture
def client():
    """Test client with a default empty fake DB; tests override get_db / get_current_user as needed."""
    app.dependency_overrides[get_db] = lambda: FakeSession()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def as_user():
    """Call as_user(user, db) to authenticate requests as `user` against the fake `db`."""
    def _set(user: User | None, db: FakeSession | None = None) -> FakeSession:
        session = db or FakeSession()
        app.dependency_overrides[get_db] = lambda: session
        if user is not None:
            app.dependency_overrides[get_current_user] = lambda: user
        return session
    yield _set
    app.dependency_overrides.clear()


# ── Real PostgreSQL Fixtures (Phase DB0) ───────────────────────────────────────
import os
import socket
from urllib.parse import urlparse
from sqlalchemy import create_engine as sa_create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine as sa_create_async_engine, AsyncSession as SaAsyncSession, async_sessionmaker


def _check_host_reachable(url: str, timeout: float = 1.0) -> bool:
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


def _get_candidate_pg_urls() -> list[str]:
    explicit = os.getenv("TEST_DATABASE_URL")
    if explicit:
        from sqlalchemy.engine import make_url
        if not (make_url(explicit).database or "").endswith("_test"):
            raise ValueError("TEST_DATABASE_URL must name a dedicated database ending in _test")
        return [explicit]
    return []


@pytest.fixture(scope="session")
def real_pg_url() -> str:
    """Returns the first accessible PostgreSQL URL or skips real_postgres tests."""
    candidates = _get_candidate_pg_urls()
    for url in candidates:
        if _check_host_reachable(url, timeout=0.5):
            try:
                engine = sa_create_engine(url, pool_pre_ping=True)
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1;"))
                return url
            except Exception:
                continue
    if os.getenv("TEST_DATABASE_URL"):
        pytest.fail("Explicit TEST_DATABASE_URL is unreachable; check the test database service and credentials.")
    pytest.skip("Set TEST_DATABASE_URL to a dedicated PostgreSQL database ending in _test.")


@pytest.fixture(scope="session")
def real_pg_engine(real_pg_url: str):
    """Sync engine for real PostgreSQL tests."""
    engine = sa_create_engine(real_pg_url, pool_pre_ping=True)
    yield engine
    engine.dispose()


@pytest.fixture
def real_pg_session(real_pg_engine) -> Session:
    """Isolated sync transaction rolling back after each test."""
    connection = real_pg_engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(bind=connection)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="session")
def real_async_pg_url(real_pg_url: str) -> str:
    """Translates sync postgresql:// URL to postgresql+asyncpg://."""
    if real_pg_url.startswith("postgresql://"):
        return real_pg_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return real_pg_url


@pytest.fixture(scope="session")
def real_async_engine(real_async_pg_url: str):
    """Async engine for real PostgreSQL tests."""
    engine = sa_create_async_engine(real_async_pg_url, pool_pre_ping=True)
    yield engine


@pytest.fixture
async def real_async_session(real_async_engine):
    """Isolated async transaction rolling back after each test."""
    async with real_async_engine.connect() as connection:
        transaction = await connection.begin()
        session_factory = async_sessionmaker(bind=connection, expire_on_commit=False)
        async with session_factory() as session:
            try:
                yield session
            finally:
                await session.close()
                await transaction.rollback()

