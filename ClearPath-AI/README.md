# CLEARPATH AI — SIH 26130

CLEARPATH AI is the project identity. The first demonstration case is a **fictional Tamil Nadu B2C dairy business with manufacturing, retail and distribution activities**. Existing React/TypeScript and FastAPI code is being improved incrementally. See [the development plan](CLEARPATH_AI_PHASED_DEVELOPMENT_PLAN.md) and [current evidence](PHASE0_PHASE1_EVIDENCE.md).

This is a development prototype. It does not submit to government portals or provide official approvals. Source review, honest document checks, full frontend integration and grounded LLM retrieval remain later phase work. Deployment selection is deferred.

## Prerequisites

- Node.js 20.19+ and npm (this baseline was tested with Node 24).
- Python 3.11 or 3.12; use the project virtual environment.
- Docker Desktop with a running Linux engine for the supplied PostgreSQL 16 + pgvector database, or an independently configured PostgreSQL server with pgvector available.
- Available localhost ports 3000, 8000 and 55432. Test database uses 5433.

## First setup — PowerShell, from this folder

```powershell
npm ci
python -m venv .venv-backend
.\.venv-backend\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
.\.venv-backend\Scripts\python.exe backend/scripts/backend_setup.py --init-env
docker compose -f backend/docker-compose.yml --env-file backend/.env up -d db
.\.venv-backend\Scripts\python.exe backend/scripts/backend_setup.py --migrate
npm run dev:full
```

Wait for the database to become healthy before running `--migrate`; retry the migration command if it was still starting. It is safe to repeat an upgrade already at head. Existing databases should be backed up and checked with `backend/scripts/db_preflight.py` before schema upgrades.

`--init-env` generates unique database/JWT secrets in the ignored `backend/.env` and never overwrites it. The database container reads its password at initial volume creation: changing the file later does not change an existing database user's password. Configure existing credentials rather than resetting volumes containing data.

`--migrate` checks connectivity and pgvector availability, applies Alembic migrations and verifies the revision. It does not seed regulatory rules or create demo accounts. `--check` performs the readiness checks without changing data. No SQLite fallback is used.

Open http://127.0.0.1:3000. API docs: http://127.0.0.1:8000/docs. Canonical database health: http://127.0.0.1:8000/health (`/api/v1/health` remains a compatibility alias). Startup refuses to launch the frontend if backend prerequisites fail. Ctrl+C stops the launched process tree.

`npm run dev` deliberately starts **only the frontend**. `START_WINDOWS.bat` invokes `dev:full` after frontend dependency installation; backend first setup above is required. Backend code changes require restarting the full launcher.

For backend-only development after setup:

```powershell
Set-Location backend
..\.venv-backend\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

For a containerized API, `docker compose -f backend/docker-compose.yml --env-file backend/.env up -d --build api`. This runs migrations before serving. Do not run it alongside the local API on the same port.

## Accounts and reference data

Register a fictional account through `/api/v1/auth/register`. No published demo password creates an account automatically. For an administrator, from `backend` run `..\.venv-backend\Scripts\python.exe scripts/create_admin.py --email admin@example.com --name "Fictional Review Admin"`; enter the password when prompted.

The initial database intentionally has no approved regulatory dataset. Do not run the legacy reference-data loader as proof of official correctness. Reviewed, versioned sources are Phase 2. Existing recovery screens, chatbot and document approval claims still have defects recorded in the phase evidence.

## Tests

```powershell
npm run build
npm test
node --test scripts/processes.test.mjs
Set-Location backend
..\.venv-backend\Scripts\python.exe -m pytest -q
..\.venv-backend\Scripts\python.exe -m pip check
```

Without `TEST_DATABASE_URL`, real PostgreSQL tests are explicitly skipped. They never fall back to the application database. To run them, start the disposable test service from the project folder:

```powershell
docker compose -f backend/docker-compose.yml --env-file backend/.env --profile test up -d test-db
```

Set `TEST_DATABASE_URL` to the test service's URL using the password from your local `backend/.env`, port 5433 and database `dairysetu_test`, then run `python -m pytest -q -m real_postgres` with the project interpreter from `backend`. Do not put passwords into shared command logs. The configured database name must end in `_test`.

The persistence test creates its own uniquely named disposable database, applies migrations twice, creates a fictional user/project through FastAPI, then retrieves the project in a fresh Python process. It drops only that newly created database. The test role needs CREATE DATABASE permission. An explicitly configured but unreachable test database fails the test run rather than silently skipping.

## Repository hygiene and history

Environment files, dependencies, uploads, build output and legacy SQLite databases are ignored by Git. Existing historical phase reports and `SPEC.md` describe earlier iterations and are not evidence that the current exit gates have passed. The phase plan governs current implementation order. Full frontend branding reconciliation is still pending.
