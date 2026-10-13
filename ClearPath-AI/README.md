# CLEARPATH AI — SIH 26130

**CLEARPATH AI** is an intelligent, automated regulatory compliance, licensing, and clearance platform for enterprises and MSMEs. The initial case study is a **Tamil Nadu dairy business encompassing manufacturing, retail, and distribution activities**.

All technical specifications, architectural designs, security audits, and phase implementation reports are organized in the [docs/](./docs/README.md) directory.

---

## Repository Structure

Designed according to industry-standard full-stack best practices:

```
ClearPath-AI/
├── docs/                       # Centralized technical documentation & reports
│   ├── README.md               # Documentation directory index
│   ├── SPEC.md                 # System requirements and domain specification
│   ├── DB_DESIGN.md            # PostgreSQL relational & pgvector schema specification
│   ├── SECURITY_FIXES.md       # Security vulnerability fixes & auth hardening
│   └── PHASE2_REPORT.md        # Phase 2 Source Registry & verification report
├── src/                        # Frontend Application (React 18 + Vite + TypeScript)
│   ├── api/                    # API client, HTTP interceptors & response adapters
│   ├── app/                    # Routing, layout, session & localization context
│   ├── components/             # Reusable UI primitives and feedback components
│   ├── features/               # Feature modules (auth, projects, clearances, chatbot, etc.)
│   ├── lib/                    # Shared client utilities
│   ├── types/                  # TypeScript interface definitions
│   └── test/                   # Vitest unit & integration test suites
├── backend/                    # Backend Application (FastAPI + SQLAlchemy + Alembic)
│   ├── alembic/                # Reversible database migrations (001 - 012)
│   ├── app/                    # FastAPI core, API routers (v1), domain models & schemas
│   ├── scripts/                # Database preflight, setup, and admin management scripts
│   └── tests/                  # Pytest test suite (including real PostgreSQL tests)
├── scripts/                    # Development process runner & build utilities
├── reference/                  # Authoritative regulatory PDFs and problem statements
├── AGENTS.md                   # AI Agent & developer governance guidelines
├── package.json                # Frontend package configuration
├── START_WINDOWS.bat           # One-click Windows startup script
└── README.md                   # Project overview & quickstart guide
```

---

## Prerequisites

- **Node.js**: 20.19+ and npm.
- **Python**: 3.11 or 3.12 (designated virtual environment: `.venv-backend`).
- **PostgreSQL**: 16 with `pgvector` extension installed (either host installation or via Docker).
- **Network Ports**:
  - Frontend: `3000`
  - Backend API: `8000`
  - Main PostgreSQL: `55432` (or host 5432)
  - Disposable Test PostgreSQL: `5433`

---

## Quickstart (PowerShell)

### 1. Install Dependencies & Setup Environment
```powershell
# Frontend dependencies
npm ci

# Backend virtual environment
python -m venv .venv-backend
.\.venv-backend\Scripts\python.exe -m pip install -r backend/requirements-dev.txt

# Initialize local environment secrets
.\.venv-backend\Scripts\python.exe backend/scripts/backend_setup.py --init-env
```

### 2. Database Migrations
```powershell
# Apply reversible Alembic migrations (Head revision: 012_source_registry)
.\.venv-backend\Scripts\python.exe backend/scripts/backend_setup.py --migrate
```

### 3. Launch Development Server
```powershell
# Starts backend (Uvicorn :8000) and frontend (Vite :3000) concurrently
npm run dev:full
```

- **Frontend App**: http://127.0.0.1:3000
- **Interactive OpenAPI Docs**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/health

---

## Test Verification

Run all test suites across the frontend and backend:

```powershell
# 1. Frontend unit and process tests (42 passing)
npm test

# 2. TypeScript compilation check (0 errors)
npx tsc --noEmit

# 3. Backend integration tests with PostgreSQL (97 passing)
$env:TEST_DATABASE_URL="postgresql://clearpathai:<password>@127.0.0.1:5433/clearpathai_test"
..\.venv-backend\Scripts\python.exe -m pytest backend/tests
```

---

## Governance & Rules

All AI agents and developers must adhere to the immutable project identity and architecture rules defined in [AGENTS.md](./AGENTS.md).
