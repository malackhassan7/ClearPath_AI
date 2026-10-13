# CLEARPATH AI --- SIH 26130

## Phase-wise Development Plan

**Official project title:** CLEARPATH AI --- A Unified Digital Platform
for the Tamil Nadu Dairy Ecosystem: Compliance, Traceability, Market
Intelligence, and Grievance Redressal

**First case study:** Fictional Tamil Nadu B2C dairy business combining
manufacturing, retail, and distribution. Brand not selected. Public
evidence only.

**Delivery objective:** Complete and test the backend and core technical
workflows, integrate the existing frontend, and prepare a reproducible
faculty-review demonstration. The final deployment platform and
production rollout decision are deferred.

## Working rules

1.  Extend the existing React/Vite + TypeScript frontend and FastAPI
    backend; do not rewrite without evidence that a component must be
    replaced.
2.  PostgreSQL remains the intended persistent database. Use SQLAlchemy
    and Alembic migrations already present in the project.
3.  Do not activate unverified regulatory rules. Every rule exposed as
    verified must retain its source, version, page/section, review
    status, and effective date where available.
4.  Never claim that document presence, filename matching, an LLM
    response, or an internal workflow state equals legal approval.
5.  Use a clearly labelled fictional case study for the demonstration.
    Do not fabricate government application statuses, official fees,
    district rankings, deadlines, or approvals.
6.  Complete and test one phase before expanding the next. Record
    commands, outcomes, and unresolved issues.
7.  Deployment-provider selection and final production rollout remain a
    later decision.

## Phase 0 --- Repository baseline and scope lock

**Purpose:** Establish the actual state of the repository before edits.

Tasks: - Inspect the repository tree, README, environment examples, API
routers, models, schemas, services, migrations, and tests. - Confirm the
intended product identity: ClearPath AI is the official project; dairy
is the first case study. - Run existing frontend build/tests and backend
tests; record exact commands and results. - Check database connection,
migration status, startup commands, environment variables, and seed-data
behaviour. - Map each faculty-review requirement to an existing
implementation, missing implementation, or known defect. - Create a
tracked issue list ordered by severity.

Exit gate: - Reproducible baseline recorded. - No destructive changes or
unreviewed migrations. - A prioritised implementation list is agreed.

## Phase 1 --- Backend reliability and database foundation

**Purpose:** Make the backend start, connect, migrate, and persist
records predictably.

Tasks: - Make configuration environment-driven; add a safe
`.env.example` without secrets. - Establish a single documented backend
startup command and health endpoint. - Resolve PostgreSQL
authentication/configuration and verify the configured database. - Make
Alembic the authoritative schema-upgrade path; document initial setup
and migration commands. - Verify persistence across service restarts. -
Make demo seed data explicit, reproducible, and labelled fictional. -
Add tests for health, database connectivity, migration setup, and
persistence.

Exit gate: - Clean setup instructions work on a fresh environment. -
Migrations apply successfully. - Create/retrieve-after-restart
persistence test passes. - No secrets are committed.

## Phase 2 --- Source registry and regulatory rule review

**Purpose:** Establish evidence before enabling the rule engine.

Inputs currently available: - Kind of Business Eligibility PDF. -
Kind-of-Business Documents Required PDF. - Aavin Form A PDF.

Tasks: - Register each source with canonical URL when known, issuer,
title, retrieved date, document hash, version/date, and review state. -
Extract relevant dairy, retail, and distribution records with page-level
provenance. - Keep eligibility, document checklist, and application-form
fields as separate linked datasets. - Flag the uploaded capacity-based
dairy eligibility tiers for review because they conflict with a newer
official eligibility publication. - Review applicable official source
versions and amendments; record conflicts rather than silently resolving
them. - Add reviewer approval, rejection, supersession, and rule-change
audit events. - Keep unknown, stale, conflicting, and unreviewed rules
out of definitive eligibility results.

Exit gate: - Every active rule has source provenance and a review
record. - Conflicting rules are not activated. - Rule ingestion and
review tests pass.

## Phase 3 --- Deterministic rule engine

**Purpose:** Produce reproducible applicability results without LLM
guesswork.

Tasks: - Define typed rule and business-profile schemas. - Represent
manufacturing, retail, distribution, storage, and transportation as
separate activities. - Preserve unknown/not-provided values; never
silently default missing capacity or turnover. - Evaluate only approved
rules using explicit criteria, operators, units, and applicability
conditions. - Return matched rules, excluded rules, missing inputs,
unresolved conflicts, source citations, and rule versions. - Recalculate
results when business activities or facts change. - Add unit and
regression tests, including boundary values and missing data.

Exit gate: - Same inputs and rule versions produce the same output. -
Unknown or conflicting inputs result in an explicit review state. -
Every result is explainable and source-linked.

## Phase 4 --- Document intake and pre-validation

**Purpose:** Replace misleading document approval with honest, testable
checks.

Tasks: - Store uploaded files and metadata safely; validate file type,
size, and content. - Link each document to a business profile, activity,
checklist item, and source/rule version. - Implement technical checks
for file readability, expected format, required metadata, and explicit
field checks where supported. - Distinguish `missing`, `uploaded`,
`unreadable`, `technical_check_passed`, `warning`, and
`manual_review_required`. - Remove unsupported compliance percentages or
approval claims based on filenames or keywords. - Add replacement,
retrieval, permission, and invalid-file tests.

Exit gate: - Invalid files are rejected safely. - Technical checks never
claim legal validity. - Each finding includes a reason and its evidence
boundary.

## Phase 5 --- Application workflow, grievances, and audit

**Purpose:** Make workflow state persistent and accountable.

Tasks: - Persist application/workflow cases and state-transition
history. - Define valid transitions and required fields for each
transition. - Enforce access control on the server, not only in frontend
navigation. - Connect grievance submission and retrieval to backend
persistence. - Record actor, timestamp, previous state, new state, and
reason for important changes. - Create notifications only from actual
recorded events and known deadlines. - Keep simulated government
statuses visibly labelled as simulated.

Exit gate: - Workflow survives restart. - Invalid transitions and
unauthorised access are rejected. - Audit history is queryable and
tested.

## Phase 6 --- Evidence-grounded LLM assistant

**Purpose:** Explain requirements from reviewed sources without
inventing rules.

Tasks: - Retrieve only approved source passages for compliance
answers. - Include source title and page/section citations in answers. -
Make the provider and model configurable through backend environment
variables. - Keep API keys server-side. - Handle missing evidence,
provider outage, empty retrieval, and conflicting sources explicitly. -
Ensure the LLM cannot modify rule outcomes, application statuses, or
reviewer decisions. - Test citations against retrieved passages and test
refusal/uncertainty behaviour.

Exit gate: - No unsupported rule or fee is presented as verified. -
Provider failures do not generate fabricated answers. - No API secret is
exposed to the browser.

## Phase 7 --- Frontend/backend integration

**Purpose:** Make existing screens use the real backend consistently.

Priority defects to address from the existing review: - Project edit
must update rather than create a duplicate. - Sources UI must call the
actual health/source endpoints. - Grievance submissions must persist
through the API. - Rules and workflow screens must use real API
responses rather than empty lists or local placeholders. - Remove false
document-validation success states. - Ensure chatbot requests use
configured API URLs and authenticated sessions where required. - Add
proper loading, empty, error, and permission-denied states.

Exit gate: - The complete main user journey works through the UI and
API. - No critical screen silently falls back to fabricated local
results.

## Phase 8 --- Integration tests and faculty demonstration

**Purpose:** Demonstrate a complete, repeatable, honest workflow.

Demo scenario: 1. Create the fictional dairy business profile. 2. Select
manufacturing, retail, and distribution independently. 3. Leave brand,
turnover, capacity, and existing licence status unknown where not
supplied. 4. Run the deterministic rule engine. 5. Show verified
requirements separately from rules requiring review. 6. Generate
activity-specific document checklists. 7. Upload sample, non-sensitive
files and demonstrate technical checks. 8. Resolve a finding and show
the updated readiness report. 9. Demonstrate source citations in the
assistant. 10. Demonstrate a workflow transition, grievance, and audit
history. 11. Show clear limitations: no direct government
application-status connection and no legal approval claim.

Required evidence: - Backend unit/integration test report. - Frontend
build and test report. - API examples or OpenAPI documentation. -
Database migration and persistence verification. - A short demo script
with expected results. - Known-limitations list.

Exit gate: - Critical end-to-end journey passes from a clean setup. -
Demo records are clearly fictional. - Every shown feature is connected
to its real implementation or labelled as simulated.

## Phase 9 --- Deployment preparation (decision deferred)

Tasks to complete later, after the demo is stable: - Select hosting only
after reviewing budget, data sensitivity, access control, and project
requirements. - Separate development and production configuration. -
Configure persistent database/storage, secrets, CORS, HTTPS, health
checks, logs, backups, and migrations. - Remove demo credentials and
simulated admin access from any public deployment. - Run smoke tests
against the deployed environment. - Decide whether the target is a
temporary review deployment or production rollout.

Exit gate: - Deployment plan and risks are documented. - Actual
deployment begins only after the final review decision.

## Current known blockers and high-priority defects

Based on the existing project review: - PostgreSQL authentication
previously failed; backend `.env` was missing; Docker was unavailable in
that environment. - A fake PDF passed the document checker with an
unsupported compliance score. - Authentication/recovery UI showed
success without a complete real verification or messaging integration. -
Project editing called the create operation. - The Sources screen
expected routes that were missing or mismatched. - Chatbot responses
were hard-coded/template-based rather than grounded in active retrieval
and a real LLM call. - Grievances were local frontend state. -
Rule/workflow data and document updates were incomplete. - Startup
commands and seed-data setup were inconsistent.

These are reported historical findings; they must be re-tested against
the current repository before being treated as current results.

## Immediate next action

Obtain the current project source as a ZIP or make the project files
available in the working environment. Then execute Phase 0 against the
actual code, report baseline results, and implement the highest-priority
Phase 1 fixes. Do not implement later phases against guessed file paths
or an assumed schema.
