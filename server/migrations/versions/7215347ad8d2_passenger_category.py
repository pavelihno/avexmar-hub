"""Passenger category

Revision ID: 7215347ad8d2
Revises: 8bd4f233fb0e
Create Date: 2025-08-10 07:08:14.306016
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7215347ad8d2'
down_revision = '8bd4f233fb0e'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # 1) Create enum type if not exists
    passenger_category = postgresql.ENUM(
        'adult', 'child', 'infant', 'infant_seat',
        name='passenger_category',
        create_type=False,  # we'll create explicitly
    )
    passenger_category.create(bind, checkfirst=True)

    # 2) Add column (nullable first to avoid NOT NULL violation)
    op.add_column(
        'booking_passengers',
        sa.Column('category', passenger_category, nullable=True)
    )

    # 3) Backfill existing rows (choose your default)
    op.execute(
        "UPDATE booking_passengers SET category = 'adult' WHERE category IS NULL")

    # 4) Enforce NOT NULL
    op.alter_column('booking_passengers', 'category', nullable=False)


def downgrade():
    bind = op.get_bind()

    # 1) Drop column
    op.drop_column('booking_passengers', 'category')

    # 2) Drop enum type (only if nothing else uses it)
    passenger_category = postgresql.ENUM(
        'adult', 'child', 'infant', 'infant_seat',
        name='passenger_category'
    )
    passenger_category.drop(bind, checkfirst=True)
