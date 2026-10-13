"""Add domain CHECK constraints using safe NOT VALID and VALIDATE CONSTRAINT.

Revision ID: 007_check_constraints
Revises: 006_case_insensitive_email
"""
from alembic import op

revision = "007_check_constraints"
down_revision = "006_case_insensitive_email"
branch_labels = None
depends_on = None

CONSTRAINTS = [
    (
        "users",
        "ck_users_role",
        "role IN ('user', 'farmer', 'entrepreneur', 'consultant', 'officer', 'admin')",
    ),
    (
        "applications",
        "ck_applications_status",
        "status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'returned', 'attention_needed')",
    ),
    (
        "applications",
        "ck_applications_license_tier",
        "license_tier IS NULL OR license_tier IN ('registration', 'state_license', 'central_license')",
    ),
    (
        "projects",
        "ck_projects_status",
        "status IN ('draft', 'active', 'completed', 'abandoned')",
    ),
    (
        "grievances",
        "ck_grievances_status",
        "status IN ('open', 'in_progress', 'resolved', 'closed')",
    ),
    (
        "grievances",
        "ck_grievances_priority",
        "priority IN ('low', 'medium', 'high', 'urgent')",
    ),
    (
        "application_documents",
        "ck_application_documents_upload_status",
        "upload_status IN ('uploaded', 'processing', 'verified', 'failed')",
    ),
    (
        "application_documents",
        "ck_application_documents_validation_status",
        "validation_status IN ('pending', 'passed', 'warning', 'failed')",
    ),
    (
        "notifications",
        "ck_notifications_notification_type",
        "notification_type IN ('info', 'success', 'warning', 'error')",
    ),
    (
        "fssai_rules",
        "ck_fssai_rules_rule_status",
        "rule_status IN ('unverified', 'needs_review', 'verified', 'superseded', 'disabled')",
    ),
    (
        "brand_requirements",
        "ck_brand_requirements_rule_status",
        "rule_status IN ('unverified', 'needs_review', 'verified', 'superseded', 'disabled')",
    ),
]


def upgrade() -> None:
    # Add each constraint NOT VALID first (avoids table lock), then validate
    for table, name, expr in CONSTRAINTS:
        op.execute(
            f"ALTER TABLE {table} ADD CONSTRAINT {name} CHECK ({expr}) NOT VALID;"
        )
        op.execute(
            f"ALTER TABLE {table} VALIDATE CONSTRAINT {name};"
        )


def downgrade() -> None:
    for table, name, _ in reversed(CONSTRAINTS):
        op.execute(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {name};")
