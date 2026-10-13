# CLEARPATH AI / SIH 26130 — Phase 0 and first Phase 1 increment

Review date: 13 October 2026 (Asia/Calcutta).

## Scope and status

Existing project: `ClearPath-AI`, formerly `DairySetu-TN-Secured`. Preserve the existing React/TypeScript and FastAPI architecture. Dairy manufacturing, retail and distribution are the first fictional case study. No deployment decision has been made.

| Phase | Status | Exit-gate evidence |
|---|---|---|
| 0 Repository audit | Complete for this increment | Current source, manifests, startup, configuration, migrations, tests and known defects inspected; baseline below |
| 1 Backend foundation | Database reliability gates passed; demo bootstrap remains | Fresh PostgreSQL + pgvector setup, all 11 migrations, repeated upgrade, API persistence across a new process, full startup and health checks passed |
| 2 Source registry | Pending | Versioned source evidence and review workflow required |
| 3 Rule engine | Pending | Approved-only rules, unknown inputs, multiple activities and conflict handling required |
| 4 Document validation | Pending — critical defect retained in backlog | Replace unsupported compliance approvals with honest technical checks |
| 5 Workflow and audit | Pending | Complete persistent integration and access-control proof |
| 6 Grounded LLM | Pending | Current static chatbot is not an implemented RAG/LLM pipeline |
| 7 Frontend integration | Pending | API wiring, project editing, grievances, auth recovery and branding |
| 8 Review demonstration | Pending | Complete repeatable fictional workflow and end-to-end evidence |
| 9 Deployment preparation | Deferred | Hosting decision remains with the user |

## Baseline before edits

- `npm run build`: passed; 658.47 KB main JavaScript chunk warning.
- `npm test`: 31 passed across 9 files; React act warnings remain.
- From backend: `../.venv-backend/Scripts/python.exe -m pytest -q -m "not real_postgres"`: 46 passed, 3 deselected.
- Project interpreter `-m pip check`: no broken requirements.
- Docker Linux engine initially unavailable. Windows PostgreSQL 18 binaries exist, but its installation has no `vector.control` file. No existing PostgreSQL passwords, data or service settings were changed.
- Root Git repository showed the entire application folder untracked. No commits or staging were performed.

## Implemented in this increment

1. Configuration reads `backend/.env` by absolute path, with process environment overrides. Missing pydantic-settings is now an installation error, rather than silent loss of environment support.
2. Synchronous connection URL derives from the async PostgreSQL URL. Mismatched database/credentials and non-PostgreSQL drivers are rejected. Validation errors hide raw input values.
3. Removed SQLite and null-session driver fallbacks. Connections use bounded timeouts; SQL parameter echo is disabled.
4. Added setup command for unique local credentials, read-only connectivity/pgvector/migration checks and explicit Alembic upgrades. Existing `.env` is never overwritten.
5. Full launcher fails on backend prerequisites, occupied ports and unhealthy/exited API. It announces readiness only after health succeeds; failure stops the launched process tree. The Windows launcher now invokes `dev:full`.
6. Added `/api/v1/health` compatibility alias for the existing frontend while retaining `/health`. Failed checks return 503 and roll back the failed transaction without exposing driver text.
7. Restored CLEARPATH AI / SIH 26130 API identity. Updated current setup documentation; historical reports remain as history.
8. Added Git exclusions for secrets, virtual environments, dependencies, generated output, uploaded files and SQLite artifacts. Generated an ignored local environment with unique credentials.
9. Compose uses project name `clearpath-ai` and localhost port 55432 to avoid the pre-existing PostgreSQL service. Production/development mode follows configuration. Legacy database/user names remain to avoid gratuitous schema churn.
10. PostgreSQL test fixtures require an explicit dedicated `_test` database. They no longer discover or fall back to the application database. Explicit connection failures fail tests.
11. Added a real persistence test: disposable database, migration to head twice, registration/project creation through FastAPI, then login/retrieval in a fresh Python process. The disposable database is removed in a finally block; application data is untouched.

## Verification after changes

- Initial backend run without a database: **58 passed, 4 skipped**. Superseded by the Docker verification below: **62 passed, zero skipped**.
- `node --test scripts/processes.test.mjs`: **4 passed** (failed prerequisite, exited API, healthy API, unhealthy timeout).
- `node --check scripts/dev.mjs`: passed.
- Python compilation of app and setup script: passed.
- Manual startup with a deliberately unreachable database: exit code 1; no frontend launched and no false success message.
- `git check-ignore` confirms backend `.env`, virtual environment, node_modules and source snapshot SQLite file are excluded.
- Frontend baseline remains **31 passed**; no frontend source was changed in this increment.

## Docker follow-up — blocker resolved, 13 October 2026

Docker Engine 29.8.2 now responds. Started the project-specific `db` and `test-db` services with the existing local credentials; both report healthy. The application database uses the new `clearpath-ai_pgdata` volume and localhost port 55432. The existing host PostgreSQL service was not changed.

Commands and outcomes:

1. `docker compose -f backend/docker-compose.yml --env-file backend/.env --profile test up -d --wait db test-db`: passed on a freshly created project database volume.
2. From `backend`, used the project interpreter to set `TEST_DATABASE_URL` in process memory from the local environment file (no password printed), then `python -m pytest -q -m real_postgres`: **4 passed, 58 deselected**.
3. The persistence test created a disposable `_test` database, applied all eleven migrations, repeated upgrade to head, registered a fictional entrepreneur and created a fictional project through FastAPI. A second Python process logged in and retrieved the same stored project. The test removed only its own disposable database.
4. `python backend/scripts/backend_setup.py --migrate` on the configured application database: all eleven migrations applied successfully, reaching `011_updated_at_triggers`.
5. `python backend/scripts/backend_setup.py --check`: PostgreSQL reachable, pgvector installed, schema at head.
6. Full backend suite with the dedicated test database configured: **62 passed in 12.63 seconds, zero skips**.
7. `npm run dev:full`: readiness check passed; Uvicorn started on 8000 and Vite on 3000.
8. Live HTTP checks: `/health`, `/api/v1/health`, `/docs` and frontend `/` all returned 200. Both health responses report `database: ok`. Frontend CORS preflight returned 200 with the expected localhost origin.
9. Launcher regression suite: **4 passed**.

The former Docker inference-socket crash no longer blocks this project. No application code changes were needed for these checks. No regulatory reference loader was run. Fictional test accounts/projects existed only in the disposable test database; they are not demo login credentials for the running application.

The Phase 1 database reliability exit gates are now evidenced. A persistent, idempotent faculty-demo bootstrap is still outstanding, alongside the later source/rule/document/integration phases. This verification does not establish that the full faculty demonstration is ready.

At completion, the local frontend/API and both project database containers were left running for inspection. The API runs in the project Python environment; only the databases are containerized in this verification. The containerized API image and a full browser end-to-end workflow were not tested in this follow-up.

## Prioritised remaining issues and requirement mapping

| ID | Priority / phase | Existing implementation | Required proof or fix |
|---|---|---|---|
| CP-001 | Resolved / 1 | PostgreSQL models and 11 Alembic revisions | Fresh migrations, repeated upgrade and persisted API data across a fresh process passed; full backend suite 62/62 |
| CP-002 | Critical / 4 | Filename/keyword document analyzer | Remove unsupported validated/90% compliance claims; implement readable-file and explicit field checks |
| CP-003 | High / 2 | Hard-coded sources, old SQLite snapshot artifact | Versioned registry, hashes, page provenance and human review; missing source routes |
| CP-004 | High / 3 | Dairy rule service and legacy data loader | Approved-only rules, multiple business activities, unit boundaries, conflicts and missing-input outcomes |
| CP-005 | High / 5,7 | Real JWT auth; recovery screens show success locally | Persistent verification/reset workflow; delivery adapter and honest UI responses |
| CP-006 | High / 7 | Project PUT exists; wizard calls create | Wire edit to PUT and prove no duplicate creation |
| CP-007 | High / 5,7 | Grievance API exists; frontend uses local state | Wire persistent submission/status and prove ownership restrictions |
| CP-008 | High / 6 | Static keyword chatbot; ingestion prints metadata | Approved-passage retrieval, real provider integration, refusal and citation tests |
| CP-009 | Medium / 5,7 | Empty generic rules/workflow dependencies; document update unsupported | Define contracts, persistence and UI wiring |
| CP-010 | Medium / 7 | Chatbot hard-codes localhost without JWT | Shared configured authenticated API client |
| CP-011 | Medium / 8 | Historical reports and prototype cases | Repeatable explicitly fictional demo and full UI/API end-to-end tests |
| CP-012 | Medium / 0,8 | Legacy ZIP script has hard-coded external paths and incomplete exclusions | Replace before producing a review archive; never package local secrets or environments |
| CP-013 | Medium / 7 | Mixed legacy UI identity and duplicated HTTP clients | Reconcile frontend branding and request/error behavior |

This report establishes verified progress, not completion of the faculty demonstration.
