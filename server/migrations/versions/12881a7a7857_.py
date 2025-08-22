"""empty message

Revision ID: 12881a7a7857
Revises: 81886dc8747e
Create Date: 2025-08-22 10:17:00.387536

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '12881a7a7857'
down_revision = '81886dc8747e'
branch_labels = None
depends_on = None


def upgrade():
    # 1) New table: booking_holds
    op.create_table(
        'booking_holds',
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('booking_holds') as batch_op:
        # Unique index: one hold per booking
        batch_op.create_index(batch_op.f('ix_booking_holds_booking_id'), ['booking_id'], unique=True)

    # 2) Add bookings.seats_number safely (default + backfill + enforce NOT NULL)
    with op.batch_alter_table('bookings') as batch_op:
        batch_op.add_column(
            sa.Column(
                'seats_number',
                sa.Integer(),
                nullable=True,
                server_default='0',  # safe for existing rows
            )
        )

    # 3) Backfill seats_number from seats BEFORE we drop seats
    #    Count only rows with a booking_id.
    op.execute(
        """
        UPDATE bookings b
        SET seats_number = COALESCE(s.cnt, 0)
        FROM (
            SELECT booking_id, COUNT(*)::int AS cnt
            FROM seats
            WHERE booking_id IS NOT NULL
            GROUP BY booking_id
        ) s
        WHERE b.id = s.booking_id;
        """
    )

    # 4) Enforce NOT NULL and remove default
    with op.batch_alter_table('bookings') as batch_op:
        batch_op.alter_column('seats_number', nullable=False)
        batch_op.alter_column('seats_number', server_default=None)

    # 5) Add payments.payment_type (Enum)
    payment_type_enum = sa.Enum('payment', 'invoice', 'refund', name='payment_type')
    payment_type_enum.create(op.get_bind(), checkfirst=True)
    with op.batch_alter_table('payments') as batch_op:
        batch_op.add_column(sa.Column('payment_type', payment_type_enum, nullable=False))

    # 6) Drop FK/unique/column from tickets that depend on seats, BEFORE dropping seats
    #    If you use naming_convention, these names will match; otherwise drop by the actual names.
    with op.batch_alter_table('tickets') as batch_op:
        # If unique constraint existed:
        try:
            batch_op.drop_constraint(batch_op.f('tickets_seat_id_key'), type_='unique')
        except Exception:
            # ignore if it doesn't exist
            pass
        # Drop the FK to seats
        try:
            batch_op.drop_constraint(batch_op.f('tickets_seat_id_fkey'), type_='foreignkey')
        except Exception:
            pass
        # Finally drop the column
        try:
            batch_op.drop_column('seat_id')
        except Exception:
            pass

    # 7) Now it's safe to drop seats
    #    (Reordering is preferred; using CASCADE is an alternative but heavier hammer.)
    op.drop_table('seats')


def downgrade():
    # 1) Recreate seats table
    op.create_table(
        'seats',
        sa.Column('seat_number', sa.VARCHAR(length=10), nullable=False),
        sa.Column('booking_id', sa.INTEGER(), nullable=True),
        sa.Column('tariff_id', sa.INTEGER(), nullable=False),
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], name=op.f('seats_booking_id_fkey'), ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tariff_id'], ['flight_tariffs.id'], name=op.f('seats_tariff_id_fkey'), ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('seats_pkey')),
        sa.UniqueConstraint('tariff_id', 'seat_number', name=op.f('uix_tariff_seat_number'), postgresql_include=[], postgresql_nulls_not_distinct=False),
    )

    # 2) Restore tickets.seat_id (values can't be reconstructed automatically, so leave nullable)
    with op.batch_alter_table('tickets') as batch_op:
        batch_op.add_column(sa.Column('seat_id', sa.INTEGER(), nullable=True))
        batch_op.create_foreign_key(batch_op.f('tickets_seat_id_fkey'), 'seats', ['seat_id'], ['id'], ondelete='CASCADE')
        batch_op.create_unique_constraint(batch_op.f('tickets_seat_id_key'), ['seat_id'], postgresql_nulls_not_distinct=False)

    # 3) Remove payments.payment_type and drop the enum type
    with op.batch_alter_table('payments') as batch_op:
        batch_op.drop_column('payment_type')
    op.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN DROP TYPE payment_type; END IF; END $$;")

    # 4) Drop bookings.seats_number
    with op.batch_alter_table('bookings') as batch_op:
        batch_op.drop_column('seats_number')

    # 5) Drop booking_holds and its index
    with op.batch_alter_table('booking_holds') as batch_op:
        batch_op.drop_index(batch_op.f('ix_booking_holds_booking_id'))
    op.drop_table('booking_holds')