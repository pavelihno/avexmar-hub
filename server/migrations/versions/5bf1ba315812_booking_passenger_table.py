"""Booking_passenger table

Revision ID: 5bf1ba315812
Revises: f0241f8cedfc
Create Date: 2025-07-22 16:21:09.764090

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5bf1ba315812'
down_revision = 'f0241f8cedfc'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('booking_passengers',
    sa.Column('booking_id', sa.Integer(), nullable=False),
    sa.Column('passenger_id', sa.Integer(), nullable=False),
    sa.Column('is_contact', sa.Boolean(), nullable=False),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ),
    sa.ForeignKeyConstraint(['passenger_id'], ['passengers.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('booking_id', 'passenger_id', name='uix_booking_passenger_unique')
    )
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.drop_column('first_name')
        batch_op.drop_column('last_name')

    with op.batch_alter_table('passengers', schema=None) as batch_op:
        batch_op.add_column(sa.Column('document_expiry_date', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('citizenship_id', sa.Integer(), nullable=False))
        batch_op.drop_constraint(batch_op.f('passengers_document_number_key'), type_='unique')
        batch_op.drop_constraint(batch_op.f('uix_document_number_type'), type_='unique')
        batch_op.create_unique_constraint('uix_passenger_unique', ['first_name', 'last_name', 'birth_date', 'document_type', 'document_number'])
        batch_op.create_foreign_key(None, 'countries', ['citizenship_id'], ['id'])

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('passengers', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_constraint('uix_passenger_unique', type_='unique')
        batch_op.create_unique_constraint(batch_op.f('uix_document_number_type'), ['document_number', 'document_type'], postgresql_nulls_not_distinct=False)
        batch_op.create_unique_constraint(batch_op.f('passengers_document_number_key'), ['document_number'], postgresql_nulls_not_distinct=False)
        batch_op.drop_column('citizenship_id')
        batch_op.drop_column('document_expiry_date')

    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_name', sa.VARCHAR(), autoincrement=False, nullable=False))
        batch_op.add_column(sa.Column('first_name', sa.VARCHAR(), autoincrement=False, nullable=False))

    op.drop_table('booking_passengers')
    # ### end Alembic commands ###
