import os
from unittest.mock import MagicMock
from alembic.autogenerate import produce_migrations, render
from alembic.autogenerate.api import AutogenContext
from alembic.migration import MigrationContext
from sqlalchemy.dialects import postgresql

import app.models
from app.database import Base

mock_conn = MagicMock()
mock_conn.dialect = postgresql.dialect()
ctx = MigrationContext.configure(connection=mock_conn)
opts = {
    "sqlalchemy_module_prefix": "sa.",
    "alembic_module_prefix": "op.",
    "render_as_batch": False,
    "user_module_prefix": None,
}
autogen_ctx = AutogenContext(ctx, Base.metadata, opts=opts)
diffs = produce_migrations(ctx, Base.metadata)

tables = []
table_names = []
for op in diffs.upgrade_ops.ops:
    rendered = render.render_op_text(autogen_ctx, op)
    tables.append(rendered)
    if hasattr(op, "table_name"):
        table_names.append(op.table_name)

header = '''"""Create the initial schema from explicit DDL.

Revision ID: 001_initial_schema
Revises:
"""
from alembic import op
import sqlalchemy as sa
import pgvector
import pgvector.sqlalchemy
from sqlalchemy.dialects import postgresql

revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
'''

body = ""
for t in tables:
    indented = "\n".join("    " + line for line in t.splitlines())
    body += "\n" + indented + "\n"

footer = """

def downgrade() -> None:
"""
for tname in reversed(table_names):
    footer += f'    op.drop_table("{tname}")\n'
footer += '    op.execute("DROP EXTENSION IF EXISTS vector;")\n'

full_content = header + body + footer

with open("alembic/versions/001_initial_schema.py", "w", encoding="utf-8") as f:
    f.write(full_content)

print(f"Successfully generated 001_initial_schema.py with {len(table_names)} explicit create_table calls.")
