"""Maintain updated_at automatically via PostgreSQL trigger on all tables having updated_at.

Revision ID: 011_updated_at_triggers
Revises: 010_audit_logs_append_only
"""
from alembic import op

revision = "011_updated_at_triggers"
down_revision = "010_audit_logs_append_only"
branch_labels = None
depends_on = None

UPDATED_AT_TABLES = [
    "users",
    "organizations",
    "brands",
    "projects",
    "applications",
    "application_documents",
    "grievances",
    "farmers",
    "government_schemes",
]


def upgrade() -> None:
    op.execute("""
        CREATE OR REPLACE FUNCTION trigger_set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    for tbl in UPDATED_AT_TABLES:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{tbl}_set_updated_at ON {tbl};")
        op.execute(f"""
            CREATE TRIGGER trg_{tbl}_set_updated_at
            BEFORE UPDATE ON {tbl}
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_updated_at();
        """)


def downgrade() -> None:
    for tbl in UPDATED_AT_TABLES:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{tbl}_set_updated_at ON {tbl};")

    op.execute("DROP FUNCTION IF EXISTS trigger_set_updated_at();")
