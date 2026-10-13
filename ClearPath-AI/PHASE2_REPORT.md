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
| Review workflow (DRAFT to NEEDS_REVIEW to VERIFIED) | Implemented |
| DISABLED and SUPERSEDED terminal/near-terminal states | Implemented |
| Conflict detection invalidates prior verifications | Implemented |
| Separate-reviewer requirement for VERIFIED state | Implemented |
| Advisory/optimistic lock on all state transitions | Implemented (pg_advisory_xact_lock) |
| Provenance fields (sha256, fingerprint, retrieved_at, canonical_url) | Implemented |
| PDF intake: size, encryption, forged-header rejection | Implemented |
| Excerpt must match text on cited source pages | Implemented |
| Rule engine refuses to produce eligibility without reviewed rules | Implemented (503 fail-closed) |
| Import script: 3 reference PDFs to 9 activity-specific DRAFT rules | Implemented |
| API: GET/POST sources, GET/POST rules, page, file, review, conflict | Implemented |
| Single-record GET /sources/versions/{id} and /registry/rules/{id} | Added this increment |
| Frontend SourcesPage, RulesPage, RegistryReview components | Implemented |
| Frontend tests (4) covering review workflow and activity filtering | Implemented |
| Backend non-postgres tests (15+) covering PDF, auth, 404 handling | Implemented |
| Audit log written for every state change | Implemented |

## Changed files (this increment, 13 October 2026)

| File | Change |
|---|---|
| backend/app/api/v1/registry.py | Added GET /sources/versions/{id} and GET /registry/rules/{id} |
| backend/tests/test_registry.py | Added 3 tests: auth guard on single-record GETs, 404 for unknown IDs |
| src/api/registry.ts | Added source(id) and rule(id) fetch methods |
| backend/app/services/rag_service.py | Connected to source registry via `search_verified_registry`, fail-closed unverified rule guard, exact citation grounding, safe LLM integration |
| backend/app/api/v1/chatbot.py | Connected `stream_chat` to `search_verified_registry` with DB session dependency |
| backend/tests/test_rag.py | Added verified registry search tests, citation formatting tests, fail-closed assertions |
| src/features/chatbot/ChatbotPage.tsx | Connected to `httpClient.post("/chatbot/chat")`, added JSDOM `scrollIntoView` guard, updated grounded copy |
| src/test/chatbot.test.tsx | Added 3 frontend unit tests for ChatbotPage verifying intro banner, fail-closed handling, and citation display |
| PHASE2_REPORT.md | Updated test results and resolved CP-008 defect |

## Migration 012: source_versions and registry_rules

Migration 012_source_registry.py (already applied at revision head) creates:

- source_versions: immutable evidence table with state in DRAFT/NEEDS_REVIEW/VERIFIED/DISABLED/SUPERSEDED, unique constraint on (source_key, fingerprint), and an immutability trigger (trg_source_versions_immutable) blocking DELETE and structural UPDATE.
- registry_rules: passage-level rules with activity in manufacturing/retail/distribution, kind in eligibility/checklist/application_form, FK to source_versions, and the same immutability trigger.
- Partial unique indices: uq_source_versions_verified and uq_registry_rules_verified guarantee only one VERIFIED record per source_key or (rule_key, activity) at a time.
- Conditional check constraints: VERIFIED requires reviewed_by, reviewed_at, review_note, and a clear conflict_note.

## Test results (13 October 2026)

### Backend (real_postgres, TEST_DATABASE_URL with PostgreSQL 16 + pgvector)

  90 passed in 26.16s (0 failed, 0 errors, 0 skipped, 0 deselected)

Including:
- test_rag.py (6 tests): language detection, static search refusal, fail-closed unreviewed fees, Tamil unreviewed refusal, grounded exact citations, DB-safe search
- test_real_postgres.py (3 tests): PostgreSQL version, pgvector extension, vector math
- test_registry.py (13 tests): PDF intake security, schema constraints, authentication, 404 handling, authorization, checklist tier gate, streaming review gate
- test_registry_postgres.py (7 tests): provenance idempotency, immutability trigger, page citations, review transitions & revocation, conflict prevention, reference PDF intake
- test_rule_engine.py (7 tests): fail-closed classify, fssai, cost, district suitability, unverified checklist, tier 1/2 document validation
- test_security_fixes.py (25 tests): auth guards, role boundaries, data protection, leak prevention
- test_foundation.py, test_migrations.py, test_persistence.py, test_preflight.py (29 tests)

### Frontend

  38 passed (11 test files in Vitest) + 4 passed (Node process tests) = 42 passed
  TypeScript compilation (`tsc --noEmit`): 0 errors

Including:
- src/test/chatbot.test.tsx (3 tests, NEW): intro message, fail-closed handling without verified rules, verified citation rendering
- src/test/registry.test.tsx (4 tests): review workflow, state transitions, conflict note blocking, activity isolation
- src/test/documents.test.tsx (5 tests): upload, validation, deletion confirmation
- src/test/accessGuards.test.tsx, api.test.tsx, app.test.tsx, authRefresh.test.ts, liveApi.test.ts, main.test.tsx, register.test.tsx, tnswp.test.ts (26 tests)
- scripts/processes.test.mjs (4 tests): startup sequence prerequisites and readiness

## Reference source imports

Three local PDFs in reference/:

  fssai-eligibility  KindofBusinessEligibility_261012_161357.pdf  10 pages
    manufacturing p1 (eligibility), retail p5 (eligibility), distribution p4-5 (eligibility)

  fssai-kob-documents  KoBwiseDocumentsrequiredforLicense_261012_161536.pdf  21 pages
    manufacturing p1 (checklist), retail p14 (checklist), distribution p14 (checklist)

  supplied-form-a  registrationForm_Aavin_261012_163138.pdf  5 pages
    manufacturing/retail/distribution pp1-4 (application_form)

All arrive in NEEDS_REVIEW state with retrieved_at=NULL and canonical_url=NULL or unknown.

To load on a running application database:
  cd backend
  python scripts/import_reference_sources.py

Run twice to confirm idempotency (no new versions on second run).

## Provenance enforcement (key invariants)

- retrieved_at in the future is rejected at import time.
- Verification requires canonical_url and retrieved_at to be set.
- Verification requires a different user from the importer (no self-review).
- A conflict_note blocks verification until explicitly cleared with a reason.
- Disabling a source version automatically demotes all its VERIFIED rules to NEEDS_REVIEW.
- A new conflicting import automatically demotes prior VERIFIED versions to NEEDS_REVIEW.

## Activities are kept distinct

- CHECK (activity IN (manufacturing, retail, distribution)) enforced at DB level.
- Partial unique index uq_registry_rules_verified operates per (rule_key, activity).
- API supports ?activity=X filtering.
- Rule engine must not aggregate across activities.

## Rule engine gate (fail-closed)

Until a rule_key+activity has a VERIFIED rule with a VERIFIED source version:
- classify_business_type returns 503
- get_fssai_rule returns 503
- calculate_total_cost returns 503
- get_district_suitability returns 503
- get_required_documents returns items marked needs_verification
- Chatbot returns empty sources array; never cites fees or thresholds

## Remaining defects

| ID | Description |
|---|---|
| CP-003 | canonical_url and retrieved_at are unknown for local reference PDFs; human review needed before VERIFIED state is reachable. |
| CP-004 | No VERIFIED rules exist yet; rule engine returns 503 for all capacity/fee/tier queries. Intentional (fail-closed). |
| CP-002 | Document validation still uses file-extension and name checks only. |
| CP-008 | (RESOLVED) Chatbot is connected to `search_verified_registry` and strictly grounded on verified source versions and rules in the registry. It fails closed when unreviewed/draft rules exist and never emits unreviewed fees or thresholds. |

## Manual verification steps

1. Start backend: npm run dev:full (from repo root).
2. Confirm GET /api/v1/sources returns 401 without a token.
3. Log in as admin (POST /api/v1/auth/login), capture JWT.
4. POST /api/v1/sources/fssai-eligibility/versions with local PDF; confirm state = NEEDS_REVIEW.
5. GET /api/v1/sources returns sha256 matching the file.
6. GET /api/v1/sources/versions/{id} returns the single record (new endpoint).
7. GET /api/v1/sources/versions/{id}/pages/1 confirms text is present.
8. POST /api/v1/rule-engine/classify with any activity; confirm 503.
9. Run python backend/scripts/import_reference_sources.py twice; confirm no new versions on second run.
10. Navigate to /admin/sources in the frontend; confirm SourcesPage shows imported PDFs with state badges.
11. Navigate to /admin/rules; confirm RulesPage shows all 9 draft rules, filterable by activity.
