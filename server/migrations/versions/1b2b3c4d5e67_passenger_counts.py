"""Add passenger_counts to bookings

Revision ID: 1b2b3c4d5e67
Revises: 0ade5bdb146c
Create Date: 2025-08-10 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '1b2b3c4d5e67'
down_revision = '0ade5bdb146c'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.add_column(sa.Column('passenger_counts', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'))


def downgrade():
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.drop_column('passenger_counts')
