"""add bookings.status enum"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '684862a46a57'
down_revision = '597b3b6cd53c'
branch_labels = None
depends_on = None

# Объявляем один и тот же объект ENUM, чтобы использовать его и в upgrade, и в downgrade
status_enum = postgresql.ENUM(
    'created',
    'expired',
    'cancelled',
    'completed',
    'passengers_added',
    'payment_pending',
    'payment_confirmed',
    'payment_failed',
    name='booking_status',
)

def upgrade():
    bind = op.get_bind()

    # 1) Создаём тип ENUM (если ещё нет)
    status_enum.create(bind, checkfirst=True)

    # 2) Добавляем колонку. Для NOT NULL лучше временно задать server_default
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'status',
            status_enum,
            nullable=False,
            server_default='created',   # чтобы миграция прошла на существующих строках
        ))

    # 3) Убираем default, если он не нужен в схеме
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.alter_column('status', server_default=None)


def downgrade():
    bind = op.get_bind()

    # 1) Удаляем колонку
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.drop_column('status')

    # 2) Опционально удаляем тип (если он больше нигде не используется)
    status_enum.drop(bind, checkfirst=True)