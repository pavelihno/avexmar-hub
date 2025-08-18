"""Add baggage and hand luggage fields to tariffs

Revision ID: a4e8f6f2710d
Revises: 4475948fc525
Create Date: 2025-08-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a4e8f6f2710d'
down_revision = '4475948fc525'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('tariffs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('baggage', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('hand_luggage', sa.Integer(), nullable=False, server_default='0'))
        batch_op.alter_column('baggage', server_default=None)
        batch_op.alter_column('hand_luggage', server_default=None)

def downgrade():
    with op.batch_alter_table('tariffs', schema=None) as batch_op:
        batch_op.drop_column('hand_luggage')
        batch_op.drop_column('baggage')
