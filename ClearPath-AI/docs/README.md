# CLEARPATH AI — Documentation Index

Welcome to the centralized documentation repository for **CLEARPATH AI** (SIH 26130). All technical specifications, architecture blueprints, security audits, and phase implementation reports are organized here.

---

## 1. Product Architecture & Specifications
| Document | Description |
|---|---|
| [SPEC.md](./SPEC.md) | Canonical platform specification, functional requirements, and domain model definitions. |
| [DB_DESIGN.md](./DB_DESIGN.md) | Relational database schema (25 tables + pgvector), CHECK constraints, foreign key policies, and trigger integrity. |
| [PRODUCT_AND_TECHNICAL_ALIGNMENT_REPORT.md](./PRODUCT_AND_TECHNICAL_ALIGNMENT_REPORT.md) | Comprehensive 9-phase product and technical alignment audit across all subsystems. |
| [DATA_SOURCE_AND_CASE_STUDY_PLAN.md](./DATA_SOURCE_AND_CASE_STUDY_PLAN.md) | Official regulatory data sources (FSSAI, NDDB, TN Policy) and Tamil Nadu case study execution plan. |

---

## 2. Security & Data Integrity Audits
| Document | Description |
|---|---|
| [SECURITY_FIXES.md](./SECURITY_FIXES.md) | Security vulnerability remediations: role authorization, JWT protection, fail-closed rule lookups, and audit logging. |
| [DATASET_VERIFICATION_AND_REPAIR.md](./DATASET_VERIFICATION_AND_REPAIR.md) | Verification and sanitization notes for regulatory thresholds, removing invented constants in favor of source-backed rules. |
| [SENIOR_CODE_REVIEW.md](./SENIOR_CODE_REVIEW.md) | Senior engineering review evaluating code quality, failure handling, and production readiness. |

---

## 3. Development Roadmaps & Implementation Plans
| Document | Description |
|---|---|
| [CLEARPATH_AI_PHASED_DEVELOPMENT_PLAN.md](./CLEARPATH_AI_PHASED_DEVELOPMENT_PLAN.md) | Complete 10-phase architectural development plan from foundation through deployment. |
| [implementation_plan.md](./implementation_plan.md) | Detailed implementation tasks, backlog tracking, and execution checklists. |

---

## 4. Phase Reports & Verification Evidence
| Document | Description |
|---|---|
| [PHASE2_REPORT.md](./PHASE2_REPORT.md) | Phase 2 Source Registry & Rule Review: 7 verification gates, source provenance, and branding harmonization. |
| [PHASE0_PHASE1_EVIDENCE.md](./PHASE0_PHASE1_EVIDENCE.md) | Evidence dossier for Phase 0 audit and Phase 1 PostgreSQL foundation & persistence tests. |
| [PHASE1_REPAIR_REPORT.md](./PHASE1_REPAIR_REPORT.md) | Schema reconciliation and Alembic migration alignment. |
| [PHASE3_REPORT.md](./PHASE3_REPORT.md) | Phase 3 deterministic rule engine preliminary tracking. |
| [PHASE4_REPORT.md](./PHASE4_REPORT.md) | Phase 4 document structural validation preliminary tracking. |
| [PHASE_REPORT.md](./PHASE_REPORT.md) | Historical consolidated phase progress summary. |
| [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md) | Verification results across test runs and integration milestones. |
| [MERGE_REPORT.md](./MERGE_REPORT.md) | Audit trail of frontend-backend API contract adapters, token refresh, and multipart uploads. |
| [FIX_CSS_AND_BUILD.md](./FIX_CSS_AND_BUILD.md) | Tailwind directive configuration and Vite production build validation. |
| [REAL_DATA_MODE.md](./REAL_DATA_MODE.md) | Live API connection and real-data mode guidelines. |
