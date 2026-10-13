# CLEARPATH AI backend — SIH 26130

FastAPI + SQLAlchemy + PostgreSQL with pgvector. Dairy is the first case study.

Use the [root setup guide](../README.md) for the current installation, migration, test and startup commands. The former source-only SQLite backend is no longer the current application.

- `scripts/backend_setup.py --init-env`: create local credentials without overwriting existing configuration.
- `scripts/backend_setup.py --check`: read-only connection, extension and migration-head check.
- `scripts/backend_setup.py --migrate`: validate the database and upgrade through Alembic.
- `app.main:app`: ASGI entry point, resolved from this directory.
- `/health`: database availability, HTTP 200 or 503; `/api/v1/health` compatibility alias.
- `/docs`: current API contract.

Configuration always loads this directory's `.env`, independent of working directory. Process environment variables override the file. The synchronous URL derives from `DATABASE_URL` unless explicitly supplied; both must target the same database. Runtime driver failures are fatal; no SQLite or null-session fallback is permitted.

The optional `requirements-ml.txt` is reserved for later implementation. Installing it does not create an ingestion pipeline. Redis/Celery are not required for the current backend.

Fresh migrations do not install reviewed rules or demonstration accounts. Source registry and rule review are Phase 2; do not activate the legacy reference loader as verified evidence.
