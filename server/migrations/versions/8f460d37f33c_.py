"""empty message

Revision ID: 8f460d37f33c
Revises: 32ae930ea75c
Create Date: 2025-08-12 14:36:26.247998
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8f460d37f33c'
down_revision = '32ae930ea75c'
branch_labels = None
depends_on = None

# новые enum-типы
PAYMENT_STATUS_NAME = 'payment_status'
PAYMENT_STATUS_VALUES = ('pending', 'waiting_for_capture', 'succeeded', 'canceled')

PAYMENT_METHOD_NAME = 'payment_method'
PAYMENT_METHOD_VALUES = ('yookassa',)


def upgrade():
    bind = op.get_bind()

    # существующий currency — не трогаем
    currency_enum = sa.Enum('rub', name='currency')

    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.drop_column('payment_status')
        batch_op.drop_column('payment_method')

    # новые enum — сначала дропаем, потом создаём
    status_enum = sa.Enum(*PAYMENT_STATUS_VALUES, name=PAYMENT_STATUS_NAME)
    method_enum = sa.Enum(*PAYMENT_METHOD_VALUES, name=PAYMENT_METHOD_NAME)

    status_enum.drop(bind=bind, checkfirst=True)
    method_enum.drop(bind=bind, checkfirst=True)

    status_enum.create(bind=bind, checkfirst=False)
    method_enum.create(bind=bind, checkfirst=False)

    # добавляем столбцы
    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False))
        batch_op.add_column(sa.Column('currency', currency_enum, nullable=False))
        batch_op.add_column(sa.Column('provider_payment_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('confirmation_token', sa.String(), nullable=True))
        batch_op.create_unique_constraint('uq_payments_provider_payment_id', ['provider_payment_id'])
        batch_op.add_column(sa.Column('payment_method', method_enum, nullable=False))
        batch_op.add_column(sa.Column('payment_status', status_enum, nullable=False))


def downgrade():
    bind = op.get_bind()

    status_enum = sa.Enum(*PAYMENT_STATUS_VALUES, name=PAYMENT_STATUS_NAME)
    method_enum = sa.Enum(*PAYMENT_METHOD_VALUES, name=PAYMENT_METHOD_NAME)

    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.drop_constraint('uq_payments_provider_payment_id', type_='unique')
        batch_op.drop_column('payment_status')
        batch_op.drop_column('payment_method')
        batch_op.drop_column('confirmation_token')
        batch_op.drop_column('provider_payment_id')
        batch_op.drop_column('currency')
        batch_op.drop_column('amount')

    # удаляем только новые enum
    status_enum.drop(bind=bind, checkfirst=True)
    method_enum.drop(bind=bind, checkfirst=True)
