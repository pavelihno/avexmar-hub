"""create booking_flights table and missing enums

Revision ID: 06bfaade332a
Revises: 8bd4f233fb0e
Create Date: 2025-08-11 14:28:04.318687
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '06bfaade332a'
down_revision = '8bd4f233fb0e'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # Create missing enums first
    passenger_category = postgresql.ENUM(
        'adult', 'child', 'infant', 'infant_seat',
        name='passenger_category'
    )
    passenger_category.create(bind, checkfirst=True)

    booking_status = postgresql.ENUM(
        'created', 'passengers_added', 'confirmed', 'payment_pending',
        'payment_confirmed', 'payment_failed', 'completed',
        'expired', 'cancelled',
        name='booking_status'
    )
    booking_status.create(bind, checkfirst=True)

    # Create booking_flights table
    op.create_table(
        'booking_flights',
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('flight_id', sa.Integer(), nullable=False),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id']),
        sa.ForeignKeyConstraint(['flight_id'], ['flights.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('booking_id', 'flight_id',
                            name='uix_booking_flight_unique')
    )

    # Add new columns
    op.add_column('booking_passengers',
                  sa.Column('category', passenger_category, nullable=False))

    op.add_column('bookings',
                  sa.Column('status', booking_status, nullable=False))
    op.add_column('bookings',
                  sa.Column('buyer_last_name', sa.String(), nullable=True))
    op.add_column('bookings',
                  sa.Column('buyer_first_name', sa.String(), nullable=True))


def downgrade():
    bind = op.get_bind()

    # Drop columns
    op.drop_column('bookings', 'buyer_first_name')
    op.drop_column('bookings', 'buyer_last_name')
    op.drop_column('bookings', 'status')
    op.drop_column('booking_passengers', 'category')

    # Drop table
    op.drop_table('booking_flights')

    # Drop enums (only if nothing else uses them)
    passenger_category = postgresql.ENUM(
        'adult', 'child', 'infant', 'infant_seat',
        name='passenger_category'
    )
    passenger_category.drop(bind, checkfirst=True)

    booking_status = postgresql.ENUM(
        'created', 'passengers_added', 'confirmed', 'payment_pending',
        'payment_confirmed', 'payment_failed', 'completed',
        'expired', 'cancelled',
        name='booking_status'
    )
    booking_status.drop(bind, checkfirst=True)
