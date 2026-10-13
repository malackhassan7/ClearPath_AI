"""Case-insensitive unique email index and normalisation.

Revision ID: 006_case_insensitive_email
Revises: 005_remove_unverified_seed_data
"""
from alembic import op
import sqlalchemy as sa

revision = "006_case_insensitive_email"
down_revision = "005_remove_unverified_seed_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Abort if any case collisions exist in existing data
    op.execute("""
        DO $$
        DECLARE
            collision_count INTEGER;
            collision_sample TEXT;
        BEGIN
            SELECT count(*), string_agg(lower_email, ', ')
            INTO collision_count, collision_sample
            FROM (
                SELECT lower(email) AS lower_email
                FROM users
                GROUP BY lower(email)
                HAVING count(*) > 1
                LIMIT 5
            ) s;

            IF collision_count > 0 THEN
                RAISE EXCEPTION 'Aborting migration 006: detected % case-duplicate email groups in users (e.g. %). Resolve collisions before applying index.',
                    collision_count, collision_sample;
            END IF;
        END $$;
    """)

    # 2. Lowercase existing emails
    op.execute("UPDATE users SET email = lower(email) WHERE email <> lower(email);")

    # 3. Drop old case-sensitive unique constraint / index if exists and create case-insensitive index
    # Note: users_email_key is the default unique constraint created in 001
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;")
    op.execute("DROP INDEX IF EXISTS ix_users_email_lower;")
    op.execute("CREATE UNIQUE INDEX ix_users_email_lower ON users (lower(email));")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_users_email_lower;")
    op.execute("ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);")
