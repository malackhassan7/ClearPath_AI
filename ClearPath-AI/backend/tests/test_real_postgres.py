"""
Real PostgreSQL tests with pgvector extension.
Uses real_pg_engine / real_pg_session fixtures; skipped automatically when PostgreSQL is not running.
"""
from __future__ import annotations

import pytest
from sqlalchemy import text


@pytest.mark.real_postgres
def test_real_postgres_connection_and_version(real_pg_engine):
    with real_pg_engine.connect() as conn:
        res = conn.execute(text("SELECT version();")).scalar()
        assert res is not None
        assert "PostgreSQL" in res


@pytest.mark.real_postgres
def test_real_postgres_pgvector_extension(real_pg_engine):
    with real_pg_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        res = conn.execute(
            text("SELECT extname FROM pg_extension WHERE extname = 'vector';")
        ).scalar()
        assert res == "vector"


@pytest.mark.real_postgres
def test_real_postgres_vector_type_math(real_pg_engine):
    with real_pg_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        val = conn.execute(
            text("SELECT '[1,2,3]'::vector <-> '[1,2,4]'::vector;")
        ).scalar()
        assert float(val) == pytest.approx(1.0)
