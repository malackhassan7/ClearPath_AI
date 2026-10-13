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
| PHASE2_REPORT.md | This file (replaces outdated TNSWP-CSV-only content) |

## Migration 012: source_versions and registry_rules

Migration 012_source_registry.py (already applied at revision head) creates:

- source_versions: immutable evidence table with state in DRAFT/NEEDS_REVIEW/VERIFIED/DISABLED/SUPERSEDED, unique constraint on (source_key, fingerprint), and an immutability trigger (trg_source_versions_immutable) blocking DELETE and structural UPDATE.
- registry_rules: passage-level rules with activity in manufacturing/retail/distribution, kind in eligibility/checklist/application_form, FK to source_versions, and the same immutability trigger.
- Partial unique indices: uq_source_versions_verified and uq_registry_rules_verified guarantee only one VERIFIED record per source_key or (rule_key, activity) at a time.
- Conditional check constraints: VERIFIED requires reviewed_by, reviewed_at, review_note, and a clear conflict_note.

## Test results (13 October 2026)

### Backend (non-postgres)

  77 passed, 11 deselected in 5.65s

Phase 2 registry tests (22 in test_registry.py + test_rule_engine.py):
- PDF rejection: forged headers, oversized, encrypted (3 tests)
- Schema validation: invalid state, invalid activity (1 test)
- Authentication: list endpoints return 401 (2 tests)
- Authentication: single-record GET returns 401 (2 tests, NEW)
- Single-record 404: unknown IDs return 404 not empty body (1 test, NEW)
- Authorization: unprivileged roles cannot review or resolve conflicts (4 tests)
- Checklist: does not infer FSSAI tier from capacity without reviewed rows (1 test)
- Chatbot: streaming has no sources and no embedded fees (1 test)
- Rule engine: refuses all operations without reviewed rows (5 tests)
- Document validation: tier-1 extension check, tier-2 name consistency (2 tests)

### Backend (real_postgres, requires TEST_DATABASE_URL)

6 tests in test_registry_postgres.py:
1. Provenance idempotency and corrected-metadata versioning
2. Immutability enforcement (UPDATE and DELETE both rejected by trigger)
3. Page citation validation and activity authorization
4. Review transitions, source revocation cascades to dependent rules, audit trail
5. Conflict prevention and resolution workflow
6. Import script idempotency: 3 source versions, 9 activity-specific DRAFT rules

### Frontend

  35 passed (10 files)

Registry-specific (4, src/test/registry.test.tsx):
- Provenance displayed without review controls for non-admin
- Correct expected_state sent on review submission
- Verification blocked while conflict note is set
- Activity filter keeps manufacturing/retail/distribution distinct

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
| CP-008 | Chatbot uses static keyword matching; no RAG pipeline is connected to the source registry. |

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
