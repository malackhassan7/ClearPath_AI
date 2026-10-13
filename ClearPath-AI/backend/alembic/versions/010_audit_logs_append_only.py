"""Enforce append-only integrity on audit_logs.

Revision ID: 010_audit_logs_append_only
Revises: 009_fk_delete_policy
"""
from alembic import op

revision = "010_audit_logs_append_only"
down_revision = "009_fk_delete_policy"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE OR REPLACE FUNCTION protect_audit_logs_append_only()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'Audit trail violation: UPDATE and DELETE operations are forbidden on audit_logs (attempted % on log_id %)',
                TG_OP, OLD.log_id;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON audit_logs;")
    op.execute("""
        CREATE TRIGGER trg_audit_logs_append_only
        BEFORE UPDATE OR DELETE ON audit_logs
        FOR EACH ROW
        EXECUTE FUNCTION protect_audit_logs_append_only();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON audit_logs;")
    op.execute("DROP FUNCTION IF EXISTS protect_audit_logs_append_only();")
