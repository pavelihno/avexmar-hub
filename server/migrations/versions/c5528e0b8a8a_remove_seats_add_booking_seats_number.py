"""remove seats table and seat_id, add booking seats_number

Revision ID: c5528e0b8a8a
Revises: 81886dc8747e
Create Date: 2025-09-03 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c5528e0b8a8a'
down_revision = '81886dc8747e'
branch_labels = None
depends_on = None


def upgrade():
    # add seats_number column to bookings
    op.add_column('bookings', sa.Column('seats_number', sa.Integer(), nullable=False, server_default='0'))
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.alter_column('seats_number', server_default=None)

    # drop seat_id from tickets
    with op.batch_alter_table('tickets', schema=None) as batch_op:
        batch_op.drop_column('seat_id')

    # drop seats table
    op.drop_table('seats')


def downgrade():
    # recreate seats table
    op.create_table(
        'seats',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('seat_number', sa.String(length=10), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=True),
        sa.Column('tariff_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tariff_id'], ['tariffs.id'], ondelete='RESTRICT'),
        sa.UniqueConstraint('tariff_id', 'seat_number', name='uix_tariff_seat_number'),
    )

    # add seat_id back to tickets
    with op.batch_alter_table('tickets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('seat_id', sa.Integer(), nullable=True, unique=True))
        batch_op.create_foreign_key('tickets_seat_id_fkey', 'seats', ['seat_id'], ['id'], ondelete='CASCADE')

    # drop seats_number column from bookings
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.drop_column('seats_number')
