# ClearPath-AI / SIH 26130 — Phase 2 Report: Source Registry and Regulatory Rule Review

Report date: 13 October 2026 (Asia/Kolkata).

## Phase 2 exit-gate summary

Phase 2 goal: a versioned, human-reviewed evidence store where regulatory passages
are anchored to source provenance, and where unreviewed rules cannot generate
definitive eligibility results. Manufacturing, retail, and distribution activities
remain distinct and gated independently.

| Item | Status |
|---|---|
| Source version table with immutability triggers | Implemented (migration 012) |
| Registry rules table with activity constraint | Implemented (migration 012) |
| Review workflow (DRAFT to NEEDS_REVIEW to VERIFIED) | Implemented & Verified |
| DISABLED and SUPERSEDED terminal/near-terminal states | Implemented & Verified |
| Conflict detection invalidates prior verifications | Implemented & Verified |
| Separate-reviewer requirement for VERIFIED state | Implemented & Verified (no self-approval) |
| Advisory/optimistic lock on all state transitions | Implemented (pg_advisory_xact_lock) |
| Provenance fields (sha256, fingerprint, retrieved_at, canonical_url) | Implemented & Verified |
| Date separation (retrieved_at, published_on, effective_on, received_at) | Implemented & Verified (strict separation; never inferred) |
| PDF intake: size, encryption, forged-header rejection | Implemented & Verified |
| Excerpt must match text on cited source pages | Implemented & Verified |
| Rule engine refuses to produce eligibility without reviewed rules | Implemented (503 fail-closed) |
| Import script: 3 reference PDFs to 9 activity-specific DRAFT rules | Implemented (idempotent) |
| API: GET/POST sources, GET/POST rules, page, file, review, conflict | Implemented & Verified |
| Single-record GET /sources/versions/{id} and /registry/rules/{id} | Implemented & Verified |
| Seven minimum verification gates regression test suite | Implemented & Verified on live PostgreSQL |
| Frontend SourcesPage, RulesPage, RegistryReview components | Implemented & Verified |
| Frontend tests (4) covering review workflow and activity filtering | Implemented & Verified (Vitest) |
| Backend tests (97) covering PDF, auth, registry, rule engine, RAG | Implemented & Verified (pytest) |
| Audit log written for every state change | Implemented & Verified |

## Changed files (Phase 2 increment, 13 October 2026)

| File | Change & Rationale |
|---|---|
| `backend/tests/test_registry.py` | Added regression tests verifying: 1) review reason min length (>= 10 chars, rejects short/empty with 422), 2) date separation (`retrieved_at`, `published_on`, `effective_on` are distinct and never inferred from each other or local `received_at`), 3) unknown dates remain None. |
| `backend/tests/test_registry_postgres.py` | Added `test_phase2_seven_minimum_verification_gates` directly verifying all 7 mandated verification gates on live PostgreSQL with pgvector (unverified provenance blocks verification, unauthorized role blocks approval, author self-review blocked, review evidence length enforcement, conflict invalidation, unverified query returns empty citations, unknown date preservation, immutability trigger enforcement). |
| `backend/app/config.py` | Added `DEMO_MODE` setting defaulting to True for transparent environment configuration. |
| `backend/app/services/rag_service.py` | Removed static `OFFICIAL_KNOWLEDGE_BASE`; connected to verified registry; added prototype demonstration notices to grounded answers. |
| `backend/tests/test_rag.py` | Labeled test chunks as `[SYNTHETIC TEST FIXTURE]`; added regression test verifying test fixtures and unreviewed thresholds cannot be mistaken for statutory law. |
| `src/features/projects/ProjectDetail.tsx` | Preserved unknown capacity and turnover without heuristic fabrication; added `DEMO REFERENCE ESTIMATE · REGULATORY REVIEW PENDING` badge and disclaimer. |
| `src/features/projects/ProjectWizard.tsx` | Added `DEMO ESTIMATE · REGULATORY REVIEW PENDING` badge and notice in Step 4. |
| `src/test/chatbot.test.tsx` | Labeled mock test citations as `[SYNTHETIC TEST FIXTURE]`. |
| `backend/app/api/v1/registry.py` | Added `GET /sources/versions/{id}` and `GET /registry/rules/{id}` single-record endpoints. |
| `src/api/registry.ts` | Added `source(id)` and `rule(id)` fetch methods. |
| `backend/app/api/v1/chatbot.py` | Connected `stream_chat` to `search_verified_registry` with DB session dependency. |
| `src/features/chatbot/ChatbotPage.tsx` | Connected to `httpClient.post("/chatbot/chat")`, added JSDOM `scrollIntoView` guard, updated grounded copy. |
| `PHASE2_REPORT.md` | Updated test results, verified source URLs, gap analysis, and 7 verification gates evidence. |

## Database and Migration Status

- **Migration 012 (`012_source_registry.py`):**
  - Applied and verified at revision head on PostgreSQL 16 with pgvector.
  - Creates `source_versions` and `registry_rules` with immutability triggers (`trg_source_versions_immutable` and `trg_registry_rules_immutable`).
  - Partial unique indexes (`uq_source_versions_verified`, `uq_registry_rules_verified`) guarantee at most one `VERIFIED` record per source_key or (rule_key, activity).
  - Check constraints enforce state transitions, activity taxonomy (`manufacturing`, `retail`, `distribution`), and rule kinds (`eligibility`, `checklist`, `application_form`).
- **Schema Gap Assessment:**
  - Demonstrated schema gaps: **0**.
  - All Phase 2 provenance, audit, date separation, and review tracking fields exist in Migration 012.
  - No new Alembic migrations were required or introduced.

## DevOps Status and Infrastructure Decision

- **Host PostgreSQL Setup:**
  - PostgreSQL 16 is installed directly on the host (port 5433 for test database `dairysetu_test`, port 55432 for main development database `dairysetu_tn`).
  - `pgvector` extension is active and verified via `test_real_postgres.py`.
  - Docker Compose is not required and was not introduced.
- **Python Virtual Environment:**
  - Designated project virtual environment is `.venv-backend` (containing `pgvector`, `psycopg2-binary`, `asyncpg`, `alembic`, `fastapi`).
  - Subprocess calls and test executions use `.venv-backend/Scripts/python.exe`.
- **Background Processes:**
  - Application launcher `node scripts/dev.mjs` runs `uvicorn` backend on port 8000 and Vite frontend on port 3000.
  - Both services are healthy and tested.

## Test Results and Verification Commands

### Execution Commands:
```powershell
# 1. Backend tests with real PostgreSQL test database:
$env:TEST_DATABASE_URL="postgresql://dairysetu:<password>@127.0.0.1:5433/dairysetu_test"
..\.venv-backend\Scripts\python.exe -m pytest tests

# 2. Frontend unit and process tests:
npm test

# 3. TypeScript compilation check:
npx tsc --noEmit
```

### Actual Results (13 October 2026):

#### 1. Backend Integration & Unit Tests:
**97 passed in 28.76s (0 failed, 0 errors, 0 skipped, 0 deselected)**
- `test_registry.py` (20 passed): PDF intake security, schema constraints, authentication, 404 handling, authorization, checklist tier gate, streaming review gate, review reason min length validation, date separation & unknown preservation.
- `test_registry_postgres.py` (8 passed): provenance idempotency, immutability triggers, page citations, review transitions & revocation, conflict prevention, reference PDF intake, and **test_phase2_seven_minimum_verification_gates**.
- `test_rag.py` (7 passed): language detection, static search refusal, fail-closed unreviewed fees, Tamil unreviewed refusal, grounded exact citations, DB-safe search refusal, synthetic test data protection.
- `test_real_postgres.py` (3 passed): PostgreSQL version, pgvector extension, vector math.
- `test_rule_engine.py` (7 passed): fail-closed classify, fssai, cost, district suitability, unverified checklist, tier 1/2 document validation.
- `test_security_fixes.py` (27 passed): auth guards, role boundaries, data protection, leak prevention.
- `test_foundation.py`, `test_migrations.py`, `test_persistence.py`, `test_preflight.py` (25 passed).

#### 2. Frontend Unit and Process Health Tests:
**42 passed (38 Vitest + 4 Node process tests, 0 failed)**
- `src/test/registry.test.tsx` (4 tests): review workflow, state transitions, conflict note blocking, activity isolation.
- `src/test/chatbot.test.tsx` (3 tests): intro banner, fail-closed handling without verified rules, verified citation rendering with prototype notice.
- `src/test/documents.test.tsx` (5 tests): upload, validation, deletion confirmation.
- `src/test/accessGuards.test.tsx`, `api.test.tsx`, `app.test.tsx`, `authRefresh.test.ts`, `liveApi.test.ts`, `main.test.tsx`, `register.test.tsx`, `tnswp.test.ts` (26 tests).
- `scripts/processes.test.mjs` (4 tests): startup sequence prerequisites and readiness.

#### 3. TypeScript Compilation:
**`npx tsc --noEmit` exited with code 0 (0 errors).**

---

## Verification of the Seven Minimum Gates

Direct test evidence from `backend/tests/test_registry_postgres.py::test_phase2_seven_minimum_verification_gates`:

1. **Gate 1: Missing or unverified provenance prevents verification:**
   - Attempting to review a source to `VERIFIED` without `canonical_url` and `retrieved_at` returns HTTP 409: `"Verification requires an original retrieval date and canonical source URL. Import a documented version; local receipt is not original retrieval."`
2. **Gate 2: Unauthorized user cannot approve a rule:**
   - Reader/applicant role receives HTTP 403 on `/review`.
   - Author cannot verify their own drafted rule (HTTP 403: `"A different reviewer must verify this record."` enforcing separation of duties).
3. **Gate 3: Required review evidence cannot be bypassed:**
   - Submitting a review with a reason shorter than 10 characters or empty returns HTTP 422 Unprocessable Entity.
4. **Gate 4: Conflicts cannot leave a stale rule authoritative:**
   - Setting `conflict_note` on a `VERIFIED` rule immediately demotes it to `NEEDS_REVIEW`.
   - Re-approving a rule with an unresolved conflict note returns HTTP 409.
5. **Gate 5: Unverified or inapplicable rules cannot produce authoritative compliance results or chatbot citations:**
   - `search_verified_registry` filters strictly on `RegistryRule.state == 'VERIFIED'` and `SourceVersion.state == 'VERIFIED'`.
   - Chatbot queries for unverified rules return `"sources": []`.
6. **Gate 6: Unknown dates remain unknown:**
   - When `published_on`, `effective_on`, or `retrieved_at` are not explicitly documented, they remain `None` / `NULL` in the database and API responses. They are never inferred from `received_at` (which only records local ingestion time).
7. **Gate 7: Existing source-version immutability and audit history remain intact:**
   - PostgreSQL triggers `trg_source_versions_immutable` reject `UPDATE` and `DELETE` queries with exception `"source_versions rows are immutable and cannot be deleted or modified"`.
   - Every import, review transition, and conflict resolution logs an immutable row to `audit_logs` with actor ID, entity ID, action, old values, new values, and rationale.

---

## Candidate Source Documents & URL Investigation

Three candidate PDF documents exist in `reference/`:

| Source Key | File Name | Issuing Authority | Candidate Canonical URL | Investigation & Findings | Status |
|---|---|---|---|---|---|
| `fssai-eligibility` | `KindofBusinessEligibility_261012_161357.pdf` (10 pages) | FSSAI / FoSCoS | `https://foscos.fssai.gov.in/assets/docs/KindofBusinessEligibility.pdf` | Covers Kind of Business (KoB) criteria for manufacturing, retail, and distribution. Publication date and gazette notification date are **not stamped** in the text. Preserved as `published_on=NULL`, `effective_on=NULL`. | `NEEDS_REVIEW` |
| `fssai-kob-documents` | `KoBwiseDocumentsrequiredforLicense_261012_161536.pdf` (21 pages) | FSSAI / FoSCoS | `https://foscos.fssai.gov.in/assets/docs/KoBwiseDocumentsrequiredforLicense.pdf` | Document checklist by business type. Contains no explicit publication date or effective date. Preserved as `published_on=NULL`, `effective_on=NULL`. | `NEEDS_REVIEW` |
| `supplied-form-a` | `registrationForm_Aavin_261012_163138.pdf` (5 pages) | FSSAI (Schedule 2) | `https://foscos.fssai.gov.in/assets/docs/Registration_Form_A.pdf` | **Crucial Provenance Finding:** Although the filename contains `Aavin`, page 1 explicitly states: *`Schedule 2 [See Regulation 2.1.1 and Regulation 2.1.7] Form 'A' Application for Registration / Renewal under Food Safety and Standards Act, 2006`*. It is standard FSSAI Form A, not an Aavin franchise guideline. Provenance conflict note correctly flags this. | `NEEDS_REVIEW` |

### Rules Remaining in `DRAFT` or `NEEDS_REVIEW`:
All 9 extracted rules derived from these 3 sources remain in `DRAFT` state:
1. `fssai-eligibility-eligibility` (manufacturing) — `DRAFT` (FSSAI capacity thresholds; pending authorized review).
2. `fssai-eligibility-eligibility` (retail) — `DRAFT` (FSSAI turnover thresholds; pending authorized review).
3. `fssai-eligibility-eligibility` (distribution) — `DRAFT` (FSSAI vehicle/distribution thresholds; pending authorized review).
4. `fssai-kob-documents-checklist` (manufacturing) — `DRAFT` (Checklist items; pending authorized review).
5. `fssai-kob-documents-checklist` (retail) — `DRAFT` (Checklist items; pending authorized review).
6. `fssai-kob-documents-checklist` (distribution) — `DRAFT` (Checklist items; pending authorized review).
7. `supplied-form-a-application_form` (manufacturing) — `DRAFT` (Form A fields; pending authorized review).
8. `supplied-form-a-application_form` (retail) — `DRAFT` (Form A fields; pending authorized review).
9. `supplied-form-a-application_form` (distribution) — `DRAFT` (Form A fields; pending authorized review).

**Reason for remaining in DRAFT:**
No authorized compliance officer has performed an independent, verified review with documented retrieval provenance. In compliance with Phase 2 principles, CLEARPATH AI **refuses to fabricate official approvals or promote rules to `VERIFIED` automatically**.

---

## Known Limitations & Remaining Blockers

1. **Production Verification Limitation:**
   - No production rule is currently in `VERIFIED` state. This is an intentional safety invariant. Phase 2 cannot be marked "100% complete with production rules" until designated administrative users log into `/admin/sources` and `/admin/rules` to certify the rules with authoritative external URLs and verification notes.
2. **Rule Engine Invocations:**
   - Calling `/api/v1/projects/{id}/clearances` will safely fail closed with HTTP 503 until rules are verified by an administrator.
3. **Traceability Subsystem Scope:**
   - Physical dairy batch and farmer ledger tracking models exist in `backend/app/models/dairy.py` but have no active endpoints. Traceability in Phase 2 is strictly limited to **regulatory document provenance and rule audit trails**.

---

## Next Recommended Phase: Phase 3 — Deterministic Rule Engine

With Phase 2 source registry, rule review workflow, and verification gates verified:
- Proceed to Phase 3: Typed multi-activity rule evaluators executing against human-reviewed rules.
- Maintain strict fail-closed posture for unverified criteria.
- Produce explainable, source-grounded clearance and checklist requirements once rules are certified.
