"""
004_seed_schemes: intentionally empty data migration.

No synthetic, placeholder, or unverified reference records are inserted.
Official source ingestion is a separate, auditable workflow.
"""
from alembic import op

revision = "004_seed_schemes"
down_revision = "003_seed_district_data"
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
