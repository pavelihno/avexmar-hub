"""Booking flight tariff dependencies

Revision ID: ef7dd5015692
Revises: 12158a6f653d
Create Date: 2025-10-30 15:28:34.312521

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ef7dd5015692'
down_revision = '12158a6f653d'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add new columns as nullable
    with op.batch_alter_table('booking_flights', schema=None) as batch_op:
        batch_op.add_column(sa.Column('flight_tariff_id',
                            sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column('seats_number', sa.Integer(), nullable=True))

    # Step 2: Migrate data from old structure to new structure
    # Find flight_tariff_id based on flight_id and tariff_id
    # and copy seats_number from bookings table
    connection = op.get_bind()

    # Migrate flight_tariff_id and seats_number for booking_flights
    connection.execute(sa.text("""
        UPDATE booking_flights bf
        SET 
            flight_tariff_id = (
                SELECT ft.id 
                FROM flight_tariffs ft 
                WHERE ft.flight_id = bf.flight_id 
                  AND ft.tariff_id = bf.tariff_id
                LIMIT 1
            ),
            seats_number = COALESCE(
                (SELECT b.seats_number FROM bookings b WHERE b.id = bf.booking_id),
                0
            )
    """))

    # Set default values for records where flight_tariff_id was not found
    connection.execute(sa.text("""
        UPDATE booking_flights
        SET flight_tariff_id = (SELECT MIN(id) FROM flight_tariffs)
        WHERE flight_tariff_id IS NULL
          AND EXISTS (SELECT 1 FROM flight_tariffs)
    """))

    # Set default seats_number to 0 if still NULL
    connection.execute(sa.text("""
        UPDATE booking_flights
        SET seats_number = 0
        WHERE seats_number IS NULL
    """))

    # Step 3: Make columns non-nullable and add constraints
    with op.batch_alter_table('booking_flights', schema=None) as batch_op:
        batch_op.alter_column('flight_tariff_id', nullable=False)
        batch_op.alter_column('seats_number', nullable=False)
        batch_op.drop_constraint(batch_op.f(
            'uix_booking_flight_unique'), type_='unique')
        batch_op.create_unique_constraint('uix_booking_flight_unique', [
                                          'booking_id', 'flight_tariff_id'])
        batch_op.drop_constraint(batch_op.f(
            'booking_flights_tariff_id_fkey'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f(
            'booking_flights_flight_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(None, 'flight_tariffs', [
                                    'flight_tariff_id'], ['id'])
        batch_op.drop_column('tariff_id')
        batch_op.drop_column('flight_id')

    # Step 4: Drop seats_number from bookings table
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.drop_column('seats_number')


def downgrade():
    # Step 1: Add back seats_number to bookings table as nullable
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('seats_number', sa.INTEGER(), autoincrement=False, nullable=True))

    # Step 2: Add back old columns to booking_flights as nullable
    with op.batch_alter_table('booking_flights', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('flight_id', sa.INTEGER(), autoincrement=False, nullable=True))
        batch_op.add_column(
            sa.Column('tariff_id', sa.INTEGER(), autoincrement=False, nullable=True))

    # Step 3: Migrate data back from new structure to old structure
    connection = op.get_bind()

    # Restore flight_id, tariff_id from flight_tariff_id
    # and copy seats_number back to bookings table
    connection.execute(sa.text("""
        UPDATE booking_flights bf
        SET 
            flight_id = (SELECT ft.flight_id FROM flight_tariffs ft WHERE ft.id = bf.flight_tariff_id),
            tariff_id = (SELECT ft.tariff_id FROM flight_tariffs ft WHERE ft.id = bf.flight_tariff_id)
    """))

    # Copy seats_number back to bookings
    connection.execute(sa.text("""
        UPDATE bookings b
        SET seats_number = (
            SELECT COALESCE(SUM(bf.seats_number), 0)
            FROM booking_flights bf
            WHERE bf.booking_id = b.id
        )
    """))

    # Set default values if NULL
    connection.execute(sa.text("""
        UPDATE booking_flights
        SET flight_id = (SELECT MIN(id) FROM flights)
        WHERE flight_id IS NULL
          AND EXISTS (SELECT 1 FROM flights)
    """))

    connection.execute(sa.text("""
        UPDATE booking_flights
        SET tariff_id = (SELECT MIN(id) FROM tariffs)
        WHERE tariff_id IS NULL
          AND EXISTS (SELECT 1 FROM tariffs)
    """))

    connection.execute(sa.text("""
        UPDATE bookings
        SET seats_number = 0
        WHERE seats_number IS NULL
    """))

    # Step 4: Make old columns non-nullable and restore constraints
    with op.batch_alter_table('booking_flights', schema=None) as batch_op:
        batch_op.alter_column('flight_id', nullable=False)
        batch_op.alter_column('tariff_id', nullable=False)
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f(
            'booking_flights_flight_id_fkey'), 'flights', ['flight_id'], ['id'])
        batch_op.create_foreign_key(batch_op.f(
            'booking_flights_tariff_id_fkey'), 'tariffs', ['tariff_id'], ['id'])
        batch_op.drop_constraint('uix_booking_flight_unique', type_='unique')
        batch_op.create_unique_constraint(batch_op.f('uix_booking_flight_unique'), [
                                          'booking_id', 'flight_id'], postgresql_nulls_not_distinct=False)
        batch_op.drop_column('seats_number')
        batch_op.drop_column('flight_tariff_id')

    # Step 5: Make seats_number in bookings non-nullable
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.alter_column('seats_number', nullable=False)
