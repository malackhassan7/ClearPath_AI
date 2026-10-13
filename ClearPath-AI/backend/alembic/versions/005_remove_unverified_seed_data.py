"""Remove known deterministic seed rows from earlier DairySetu builds.

Revision ID: 005_remove_unverified_seed_data
Revises: 004_seed_schemes
"""
from alembic import op
revision = "005_remove_unverified_seed_data"
down_revision = "004_seed_schemes"
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Dynamic column checks allow cleanup against both the older hand-written schema
    # and the current ORM-aligned schema. Only deterministic seed IDs are targeted.
    op.execute("""DO $do$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brand_requirements' AND column_name='brand_req_id') THEN
        EXECUTE $sql$DELETE FROM brand_requirements WHERE brand_req_id::text LIKE 'br100000-%'$sql$;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brand_requirements' AND column_name='requirement_id') THEN
        EXECUTE $sql$DELETE FROM brand_requirements WHERE requirement_id::text LIKE 'br100000-%'$sql$;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fssai_required_documents' AND column_name='fssai_doc_id') THEN
        EXECUTE $sql$DELETE FROM fssai_required_documents WHERE fssai_doc_id::text LIKE 'd1000000-%'$sql$;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fssai_required_documents' AND column_name='doc_id') THEN
        EXECUTE $sql$DELETE FROM fssai_required_documents WHERE doc_id::text LIKE 'd1000000-%'$sql$;
      END IF;
      IF to_regclass('fssai_rules') IS NOT NULL THEN EXECUTE $sql$DELETE FROM fssai_rules WHERE rule_id::text LIKE 'r1000000-%'$sql$; END IF;
      IF to_regclass('brands') IS NOT NULL THEN EXECUTE $sql$DELETE FROM brands WHERE brand_id::text LIKE 'b2000000-%'$sql$; END IF;
      IF to_regclass('business_types') IS NOT NULL THEN EXECUTE $sql$DELETE FROM business_types WHERE business_type_id::text LIKE 'b1000000-%'$sql$; END IF;
      IF to_regclass('district_milk_production') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='district_milk_production' AND column_name='data_source') THEN
          EXECUTE $sql$DELETE FROM district_milk_production WHERE source_url LIKE '%time-series-data-details-milk-production-districts-tamil-nadu' AND retrieved_on = DATE '2024-01-15'$sql$;
        ELSE
          EXECUTE $sql$DELETE FROM district_milk_production WHERE source_url LIKE '%time-series-data-details-milk-production-districts-tamil-nadu' AND retrieved_on = DATE '2024-01-15'$sql$;
        END IF;
      END IF;
      IF to_regclass('government_schemes') IS NOT NULL THEN EXECUTE $sql$DELETE FROM government_schemes WHERE scheme_id::text LIKE 's1000000-%'$sql$; END IF;
    END $do$;""")

def downgrade() -> None:
    # Deliberately do not restore unverified seed data.
    pass
