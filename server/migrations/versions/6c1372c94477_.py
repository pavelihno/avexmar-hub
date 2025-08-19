"""empty message

Revision ID: 6c1372c94477
Revises: ab1d8149c8f6
Create Date: 2025-08-18 09:39:19.366436

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6c1372c94477'
down_revision = 'ab1d8149c8f6'
branch_labels = None
depends_on = None



def upgrade():
    # Step 1: add columns with a server default 0
    with op.batch_alter_table('tariffs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('baggage', sa.Integer(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column('hand_luggage', sa.Integer(), nullable=False, server_default="0"))

    # Step 2: if you want to drop the server default (so future inserts must explicitly set values)
    with op.batch_alter_table('tariffs', schema=None) as batch_op:
        batch_op.alter_column('baggage', server_default=None)
        batch_op.alter_column('hand_luggage', server_default=None)


def downgrade():
    with op.batch_alter_table('tariffs', schema=None) as batch_op:
        batch_op.drop_column('hand_luggage')
        batch_op.drop_column('baggage')
