"""
002_seed_fssai_data: intentionally empty data migration.

No synthetic, placeholder, or unverified reference records are inserted.
Official source ingestion is a separate, auditable workflow.
"""
from alembic import op

revision = "002_seed_fssai_data"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
