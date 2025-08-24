"""set user inactive by default

Revision ID: c2a67e98c1b0
Revises: 06bfaade332a
Create Date: 2025-09-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c2a67e98c1b0'
down_revision = '06bfaade332a'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('users', 'is_active', server_default=sa.text('false'))


def downgrade():
    op.alter_column('users', 'is_active', server_default=sa.text('true'))
