"""Foreign-key delete policy and regulatory record preservation.

Revision ID: 009_fk_delete_policy
Revises: 008_unique_natural_keys
"""
from alembic import op

revision = "009_fk_delete_policy"
down_revision = "008_unique_natural_keys"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Modify application_reviews.reviewer_id:
    # Drop existing CASCADE foreign key constraint, make column nullable, and recreate with ON DELETE SET NULL
    op.execute("""
        DO $$
        DECLARE r_fk TEXT;
        BEGIN
            SELECT tc.constraint_name INTO r_fk
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'application_reviews'
              AND kcu.column_name = 'reviewer_id'
              AND tc.constraint_type = 'FOREIGN KEY'
            LIMIT 1;

            IF r_fk IS NOT NULL THEN
                EXECUTE 'ALTER TABLE application_reviews DROP CONSTRAINT ' || quote_ident(r_fk);
            END IF;
        END $$;
    """)

    op.execute("ALTER TABLE application_reviews ALTER COLUMN reviewer_id DROP NOT NULL;")
    op.execute("""
        ALTER TABLE application_reviews
        ADD CONSTRAINT fk_application_reviews_reviewer_id
        FOREIGN KEY (reviewer_id) REFERENCES users (user_id) ON DELETE SET NULL;
    """)

    # 2. Submitted application delete protection:
    # Applications that have progressed beyond 'draft' must never be deleted
    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_submitted_application_delete()
        RETURNS TRIGGER AS $$
        BEGIN
            IF OLD.status IS NOT NULL AND OLD.status <> 'draft' THEN
                RAISE EXCEPTION 'Regulatory violation: cannot delete application % with status ''%''. Only draft applications may be deleted.',
                    OLD.application_id, OLD.status;
            END IF;
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("DROP TRIGGER IF EXISTS trg_protect_submitted_applications ON applications;")
    op.execute("""
        CREATE TRIGGER trg_protect_submitted_applications
        BEFORE DELETE ON applications
        FOR EACH ROW
        EXECUTE FUNCTION prevent_submitted_application_delete();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_protect_submitted_applications ON applications;")
    op.execute("DROP FUNCTION IF EXISTS prevent_submitted_application_delete();")

    op.execute("ALTER TABLE application_reviews DROP CONSTRAINT IF EXISTS fk_application_reviews_reviewer_id;")
    op.execute("""
        ALTER TABLE application_reviews
        ADD CONSTRAINT application_reviews_reviewer_id_fkey
        FOREIGN KEY (reviewer_id) REFERENCES users (user_id) ON DELETE CASCADE;
    """)
    op.execute("ALTER TABLE application_reviews ALTER COLUMN reviewer_id SET NOT NULL;")
