# ClearPathAI Database Design & Integrity Specification

## 1. Entity-Relationship Overview
ClearPathAI comprises 25 relational tables and pgvector embeddings supporting Tamil Nadu dairy compliance, traceability, and market intelligence:

```
[Users] ──< [UserOrganization] >── [Organizations]
   │                 │
   │──< [Projects] ──┴──< [Applications] ──< [ApplicationDocuments] ──< [DocumentFlags]
   │                           │                        │
   │                           ├──< [ApplicationReviews]│
   │                           └──< [ApplicationStatusHistory]
   ├──< [Grievances]
   ├──< [Notifications]
   └──< [AuditLogs]

[Brands] ──< [BrandRequirements]
   └──< [ProductBatches]

[BusinessTypes] ──< [FSSAIRules] ──< [FSSAIRequiredDocuments]

[DistrictMilkProduction]
[GovernmentSchemes]
[Farmers] ──< [MilkCollections]
[ChatbotDocuments] ──< [ChatbotChunks (Vector-384)]
[ChatbotConversations]
```

---

## 2. Allowed Value Sets (CHECK Constraints)
Derived directly from route schemas (`app/schemas/*.py`), domain models (`app/models/*.py`), and frontend adapters (`src/api/adapters.ts`):

| Table | Column | Constraint Name | Allowed Value Set | Validation Technique |
|---|---|---|---|---|
| `users` | `role` | `ck_users_role` | `user`, `farmer`, `entrepreneur`, `consultant`, `officer`, `admin` | NOT VALID -> VALIDATE CONSTRAINT |
| `applications` | `status` | `ck_applications_status` | `draft`, `submitted`, `under_review`, `approved`, `rejected`, `returned`, `attention_needed` | NOT VALID -> VALIDATE CONSTRAINT |
| `applications` | `license_tier` | `ck_applications_license_tier` | `registration`, `state_license`, `central_license`, or `NULL` | NOT VALID -> VALIDATE CONSTRAINT |
| `projects` | `status` | `ck_projects_status` | `draft`, `active`, `completed`, `abandoned` | NOT VALID -> VALIDATE CONSTRAINT |
| `grievances` | `status` | `ck_grievances_status` | `open`, `in_progress`, `resolved`, `closed` | NOT VALID -> VALIDATE CONSTRAINT |
| `grievances` | `priority` | `ck_grievances_priority` | `low`, `medium`, `high`, `urgent` | NOT VALID -> VALIDATE CONSTRAINT |
| `application_documents` | `upload_status` | `ck_application_documents_upload_status` | `uploaded`, `processing`, `verified`, `failed` | NOT VALID -> VALIDATE CONSTRAINT |
| `application_documents` | `validation_status` | `ck_application_documents_validation_status` | `pending`, `passed`, `warning`, `failed` | NOT VALID -> VALIDATE CONSTRAINT |
| `notifications` | `notification_type` | `ck_notifications_notification_type` | `info`, `success`, `warning`, `error` | NOT VALID -> VALIDATE CONSTRAINT |
| `fssai_rules` | `rule_status` | `ck_fssai_rules_rule_status` | `unverified`, `needs_review`, `verified`, `superseded`, `disabled` | NOT VALID -> VALIDATE CONSTRAINT |
| `brand_requirements` | `rule_status` | `ck_brand_requirements_rule_status` | `unverified`, `needs_review`, `verified`, `superseded`, `disabled` | NOT VALID -> VALIDATE CONSTRAINT |

---

## 3. Foreign Key Delete Policy & Regulatory Protection

Regulatory trails must survive user removal; users are soft-deactivated via `is_active = false`. If a hard delete occurs, records forming statutory evidence must never be cascaded:

| Child Table | Foreign Key Column | Target Table & Column | Policy | Rationale |
|---|---|---|---|---|
| `application_reviews` | `reviewer_id` | `users.user_id` | `SET NULL` | Regulatory audit records: an officer's statutory review and decision must survive account deletion. |
| `application_status_history` | `changed_by` | `users.user_id` | `SET NULL` | Audit trail: status transition logs must be preserved for compliance and legal accountability. |
| `audit_logs` | `actor_id` | `users.user_id` | `SET NULL` | Tamper-proof trail: admin/officer action log must remain intact even if the actor account is purged. |
| `grievances` | `user_id` | `users.user_id` | `SET NULL` | Citizen grievance records must remain for institutional reporting even if user closes account. |
| `grievances` | `assigned_to` | `users.user_id` | `SET NULL` | Officer re-assignment preserves grievance history. |
| `farmers` | `user_id` | `users.user_id` | `SET NULL` | Physical dairy farmer entity and milk records exist independently of platform user logins. |
| `chatbot_conversations` | `user_id` | `users.user_id` | `SET NULL` | Anonymous/historical query analytics remain intact without identifying user linkage. |
| `projects` | `organization_id` | `organizations.organization_id` | `SET NULL` | Project records remain if parent cooperative changes structure. |
| `projects` | `business_type_id` | `business_types.business_type_id` | `SET NULL` | Classification schema adjustments do not destroy ongoing projects. |
| `projects` | `brand_id` | `brands.brand_id` | `SET NULL` | Co-branding or franchise disassociations preserve the project record. |
| `applications` | `project_id` | `projects.project_id` | `CASCADE` | Working draft applications are scoped directly to the project container. |
| `applications` | `applicant_id` | `users.user_id` | `RESTRICT` via trigger | Non-draft applications cannot be deleted. Deletion of users with active applications is blocked. |
| `application_documents` | `application_id` | `applications.application_id` | `CASCADE` | Scoped to application lifecycle; physical files cleaned up by transactional handler. |
| `document_flags` | `document_id` | `application_documents.document_id`| `CASCADE` | Flags describe the specific document version. |
| `document_flags` | `resolved_by` | `users.user_id` | `SET NULL` | Resolution flag record persists if officer departs. |

### Application Deletion Guard Trigger
`trg_protect_submitted_applications`: Ensures that once an application has been submitted (`status <> 'draft'`), it can **never** be deleted. Attempting `DELETE` on any submitted, under-review, approved, or returned application raises a PostgreSQL exception.

---

## 4. Immutability & Audit Trail Protections

1. **`audit_logs` Append-Only Trigger**:
   - `trg_audit_logs_append_only` blocks all `UPDATE` and `DELETE` queries on `audit_logs`.
   - Protects statutory compliance data against tampering.
2. **Case-Insensitive Email Integrity**:
   - Stored in lower-case across all entry points (`auth/register`, `auth/login`, `admin/users`, `create_admin.py`).
   - Unique index: `CREATE UNIQUE INDEX ix_users_email_lower ON users (lower(email))`.
   - Migration 006 checks for collisions and aborts with offending IDs before applying index.
3. **Automatic `updated_at` DB Triggers**:
   - Function `trigger_set_updated_at()` executed on `BEFORE UPDATE` across all 9 mutable tables (`users`, `organizations`, `brands`, `projects`, `applications`, `application_documents`, `grievances`, `farmers`, `government_schemes`).
   - Guarantees `updated_at` reflects true database mutation time regardless of whether queries originate from ORM or raw SQL.

---

## 5. Migration Strategy for Populated Databases

1. **Reversibility**: Every migration (`001` through `011`) implements working `upgrade()` and `downgrade()` routines.
2. **Zero Table Locks**: CHECK constraints are applied via `ADD CONSTRAINT ... NOT VALID` followed by `VALIDATE CONSTRAINT`.
3. **Collision Detection**: Migrations adding uniqueness checks abort with row IDs upon duplicate detection; they never silently delete or alter data.
4. **Preflight Scanner**: Run `python backend/scripts/db_preflight.py` before executing migrations on populated instances to inspect and resolve any potential violations beforehand.
