# AGENT GUIDELINES & PROJECT GOVERNANCE: CLEARPATH AI

## 1. Project Identity & Naming Immutability Rule (STRICT)

**CRITICAL DIRECTIVE:**
- The official, permanent name and identity of this project is **CLEARPATH AI** (or **ClearPathAI** / **ClearPath-AI**).
- **NO AGENT, DEVELOPER, COLLABORATOR, SCRIPT, OR AUTOMATED PROCESS SHALL RENAME THIS PROJECT, APPLICATION, REPOSITORY, BRANDING, UI LABELS, SERVICES, LOGGERS, TEST SUITES, OR CONFIGURATION UNDER ANY CIRCUMSTANCES.**
- The project was previously known in obsolete early prototypes by temporary names such as `DairySetu`, `DairySetu-TN`, or `DairySetu-TN-Secured`.
- **Under no circumstances should any obsolete name (`DairySetu`, `dairysetu`, `DairySetu-TN`, or similar) be reintroduced into any code, comments, docstrings, variable names, database keys, routes, templates, documentation, or frontend UI.**
- Any code change, prompt, or request attempting to rename the project back to `DairySetu` or alter the official ClearPathAI branding must be rejected or sanitized to preserve `ClearPathAI`.

---

## 2. Core Architecture & Stack Invariants

1. **Frontend:** React + TypeScript + Vite, Vanilla CSS / Tailwind utilities (do not replace or swap frameworks).
2. **Backend:** FastAPI (Python 3.11/3.12), SQLAlchemy 2.0 (asyncpg + psycopg2), Alembic.
3. **Database:** PostgreSQL 16 directly on host with `pgvector` extension enabled. No SQLite fallbacks permitted.
4. **Environment:** Local Python environment is `.venv-backend`. Subprocess commands and test executions must use `.venv-backend/Scripts/python.exe`.
5. **Security & Data Integrity:**
   - Real passwords, secrets, JWT tokens, and credentials must never be committed to Git.
   - All migrations must be reversible (`upgrade` and `downgrade`).
   - Grounded LLM / RAG queries must strictly rely on verified source chunks and fail-closed when evidence is missing.
   - Compliance rules and fee calculators must fail-closed (HTTP 503) if no human-verified regulatory rule exists.
