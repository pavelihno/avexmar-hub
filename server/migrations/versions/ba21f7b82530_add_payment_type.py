"""add payment type

Revision ID: ba21f7b82530
Revises: c5528e0b8a8a
Create Date: 2025-08-22 09:31:27.843752

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ba21f7b82530'
down_revision = 'c5528e0b8a8a'
branch_labels = None
depends_on = None


def upgrade():
    payment_type = sa.Enum('payment', 'invoice', 'refund', name='payment_type')
    payment_type.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'payments',
        sa.Column('payment_type', payment_type, nullable=False, server_default='payment'),
    )
    op.alter_column('payments', 'payment_type', server_default=None)


def downgrade():
    op.drop_column('payments', 'payment_type')
    payment_type = sa.Enum('payment', 'invoice', 'refund', name='payment_type')
    payment_type.drop(op.get_bind(), checkfirst=True)
