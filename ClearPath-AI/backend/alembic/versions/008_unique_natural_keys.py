"""Enforce natural key uniqueness across reference and relationship tables.

Revision ID: 008_unique_natural_keys
Revises: 007_check_constraints
"""
from alembic import op

revision = "008_unique_natural_keys"
down_revision = "007_check_constraints"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Pre-check for duplicate user_organizations
    op.execute("""
        DO $$
        DECLARE cnt INTEGER;
        BEGIN
            SELECT count(*) INTO cnt
            FROM (
                SELECT user_id, organization_id FROM user_organizations
                GROUP BY user_id, organization_id HAVING count(*) > 1
            ) s;
            IF cnt > 0 THEN
                RAISE EXCEPTION 'Aborting migration 008: % duplicate (user_id, organization_id) groups found in user_organizations.', cnt;
            END IF;
        END $$;
    """)
    op.execute("""
        ALTER TABLE user_organizations
        ADD CONSTRAINT uq_user_organizations_user_org UNIQUE (user_id, organization_id);
    """)

    # 2. Pre-check for duplicate district_milk_production
    op.execute("""
        DO $$
        DECLARE cnt INTEGER;
        BEGIN
            SELECT count(*) INTO cnt
            FROM (
                SELECT district, year FROM district_milk_production
                GROUP BY district, year HAVING count(*) > 1
            ) s;
            IF cnt > 0 THEN
                RAISE EXCEPTION 'Aborting migration 008: % duplicate (district, year) groups found in district_milk_production.', cnt;
            END IF;
        END $$;
    """)
    op.execute("""
        ALTER TABLE district_milk_production
        ADD CONSTRAINT uq_district_milk_production_district_year UNIQUE (district, year);
    """)

    # 3. Pre-check for duplicate brand_requirements
    op.execute("""
        DO $$
        DECLARE cnt INTEGER;
        BEGIN
            SELECT count(*) INTO cnt
            FROM (
                SELECT brand_id, requirement_name FROM brand_requirements
                GROUP BY brand_id, requirement_name HAVING count(*) > 1
            ) s;
            IF cnt > 0 THEN
                RAISE EXCEPTION 'Aborting migration 008: % duplicate (brand_id, requirement_name) groups found in brand_requirements.', cnt;
            END IF;
        END $$;
    """)
    op.execute("""
        ALTER TABLE brand_requirements
        ADD CONSTRAINT uq_brand_requirements_brand_req_name UNIQUE (brand_id, requirement_name);
    """)

    # 4. Pre-check and unique index on fssai_rules (handling nullable capacity ranges)
    op.execute("""
        DO $$
        DECLARE cnt INTEGER;
        BEGIN
            SELECT count(*) INTO cnt
            FROM (
                SELECT business_type_id, license_tier, COALESCE(capacity_min_lpd, -1), COALESCE(capacity_max_lpd, -1)
                FROM fssai_rules
                GROUP BY business_type_id, license_tier, COALESCE(capacity_min_lpd, -1), COALESCE(capacity_max_lpd, -1)
                HAVING count(*) > 1
            ) s;
            IF cnt > 0 THEN
                RAISE EXCEPTION 'Aborting migration 008: % duplicate capacity tier rules found in fssai_rules.', cnt;
            END IF;
        END $$;
    """)
    op.execute("""
        CREATE UNIQUE INDEX uq_fssai_rules_tier_capacity
        ON fssai_rules (business_type_id, license_tier, COALESCE(capacity_min_lpd, -1), COALESCE(capacity_max_lpd, -1));
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_fssai_rules_tier_capacity;")
    op.execute("ALTER TABLE brand_requirements DROP CONSTRAINT IF EXISTS uq_brand_requirements_brand_req_name;")
    op.execute("ALTER TABLE district_milk_production DROP CONSTRAINT IF EXISTS uq_district_milk_production_district_year;")
    op.execute("ALTER TABLE user_organizations DROP CONSTRAINT IF EXISTS uq_user_organizations_user_org;")
