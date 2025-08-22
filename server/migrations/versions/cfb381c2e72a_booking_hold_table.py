"""booking hold table

Revision ID: cfb381c2e72a
Revises: 81886dc8747e
Create Date: 2025-08-22 06:32:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cfb381c2e72a'
down_revision = '81886dc8747e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'booking_holds',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('booking_id'),
    )
    op.create_index(
        op.f('ix_booking_holds_booking_id'), 'booking_holds', ['booking_id'], unique=False
    )


def downgrade():
    op.drop_index(op.f('ix_booking_holds_booking_id'), table_name='booking_holds')
    op.drop_table('booking_holds')
