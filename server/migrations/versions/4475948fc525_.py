"""empty message

Revision ID: 4475948fc525
Revises: 73d3db76b798
Create Date: 2025-08-14 18:54:30.794813

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4475948fc525'
down_revision = '73d3db76b798'
branch_labels = None
depends_on = None


# Define enum types separately
fee_application_enum = sa.Enum('booking', 'cancellation', name='fee_application')
fee_term_enum = sa.Enum('none', 'before_24h', 'within_24h', 'after_departure', name='fee_term')

def upgrade():
    # Create enum types in DB
    fee_application_enum.create(op.get_bind(), checkfirst=True)
    fee_term_enum.create(op.get_bind(), checkfirst=True)

    # Then add the columns
    with op.batch_alter_table('fees', schema=None) as batch_op:
        batch_op.add_column(sa.Column('application', fee_application_enum, nullable=False))
        batch_op.add_column(sa.Column('application_term', fee_term_enum, nullable=False))

def downgrade():
    with op.batch_alter_table('fees', schema=None) as batch_op:
        batch_op.drop_column('application_term')
        batch_op.drop_column('application')

    # Drop enum types
    fee_application_enum.drop(op.get_bind(), checkfirst=True)
    fee_term_enum.drop(op.get_bind(), checkfirst=True)
