"""add fields to payment

Revision ID: b21bf0d7b1c3
Revises: 06bfaade332a
Create Date: 2025-10-08 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b21bf0d7b1c3'
down_revision = '06bfaade332a'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('payments', sa.Column('is_paid', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('payments', sa.Column('status_history', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'))
    op.add_column('payments', sa.Column('last_webhook', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('payments', sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.alter_column('payments', 'is_paid', server_default=None)


def downgrade():
    op.drop_column('payments', 'meta')
    op.drop_column('payments', 'last_webhook')
    op.drop_column('payments', 'status_history')
    op.drop_column('payments', 'is_paid')
