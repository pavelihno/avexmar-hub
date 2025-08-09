import random
import string
import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import db
from app.models._base_model import BaseModel
from app.config import Config

if TYPE_CHECKING:
    from app.models.payment import Payment
    from app.models.ticket import Ticket
    from app.models.seat import Seat
    from app.models.booking_passenger import BookingPassenger


class Booking(BaseModel):
    __tablename__ = 'bookings'

    # Booking details
    public_id = db.Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True)
    booking_number = db.Column(db.String, unique=True, nullable=True, index=True)
    status = db.Column(db.Enum(Config.BOOKING_STATUS), nullable=False, default=Config.DEFAULT_BOOKING_STATUS)
    status_history = db.Column(JSONB, nullable=False, server_default='[]', default=list)

    # Customer details
    email_address = db.Column(db.String, nullable=True)
    phone_number = db.Column(db.String, nullable=True)

    # Price details
    currency = db.Column(db.Enum(Config.CURRENCY), nullable=False, default=Config.DEFAULT_CURRENCY)
    fare_price = db.Column(db.Float, nullable=False)
    fees = db.Column(db.Float, nullable=False, default=0.0)
    total_discounts = db.Column(db.Float, nullable=False, default=0.0)
    total_price = db.Column(db.Float, nullable=False)

    # Relationships
    payments: Mapped[List['Payment']] = db.relationship(
        'Payment', back_populates='booking', lazy='dynamic', cascade='all, delete-orphan'
    )
    tickets: Mapped[List['Ticket']] = db.relationship(
        'Ticket', back_populates='booking', lazy='dynamic', cascade='all, delete-orphan'
    )
    seats: Mapped[List['Seat']] = db.relationship(
        'Seat', back_populates='booking', lazy='dynamic', cascade='save-update, merge'
    )
    booking_passengers: Mapped[List['BookingPassenger']] = db.relationship(
        'BookingPassenger', back_populates='booking', lazy='dynamic', cascade='all, delete-orphan'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'public_id': str(self.public_id),
            'booking_number': self.booking_number,
            'booking_date': self.created_at.date().isoformat(),
            'status': self.status.value,
            'email_address': self.email_address,
            'phone_number': self.phone_number,
            'currency': self.currency.value,
            'fare_price': self.fare_price,
            'total_discounts': self.total_discounts,
            'fees': self.fees,
            'total_price': self.total_price,
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['booking_number'], descending=False)

    @classmethod
    def __generate_booking_number(cls, session: Session):
        """Generates a unique booking number (PNR - Passenger Name Record)"""
        existing_booking_numbers = {
            booking.booking_number for booking in session.query(cls).all()}

        while True:
            booking_number = ''.join(
                random.choice(string.ascii_uppercase + string.digits)
                if ch == 'X' else ch
                for ch in Config.PNR_MASK
            )
            if booking_number not in existing_booking_numbers:
                return booking_number

    @classmethod
    def create(cls, session: Session | None = None, **kwargs):
        session = session or db.session
        kwargs['booking_number'] = cls.__generate_booking_number(session)
        return super().create(session, **kwargs)

    # Rewrite using Config.BOOKING_STATUS
    # ALLOWED_TRANSITIONS = {
    #     'created': {'passengers_added', 'cancelled', 'expired'},
    #     'passengers_added': {'payment_pending', 'cancelled', 'expired'},
    #     'payment_pending': {'payment_confirmed', 'payment_failed', 'cancelled', 'expired'},
    #     'payment_failed': {'payment_pending', 'cancelled', 'expired'},
    #     'payment_confirmed': {'completed', 'cancelled'},
    #     'completed': {'cancelled'},
    #     'expired': set(),
    #     'cancelled': set(),
    # }

    # TERMINAL = {'expired', 'cancelled'}
    # def transition_status(booking, to_status: str, *, reason=None, by='system', meta=None, expect_version=None):
    # from app import db  # где лежит сессия

    # now = datetime.now(timezone.utc)
    # from_status = booking.status.value if hasattr(booking.status, 'value') else str(booking.status)

    # # оптимистическая блокировка
    # if expect_version is not None and booking.version != expect_version:
    #     raise ConflictError('booking_version_conflict')

    # if to_status not in ALLOWED_TRANSITIONS.get(from_status, set()):
    #     raise ConflictError(f'illegal_transition:{from_status}->{to_status}')

    # # обновить поля
    # booking.status = Config.BOOKING_STATUS[to_status]
    # booking.status_updated_at = now
    # booking.version = booking.version + 1

    # # TTL управление
    # if to_status in ('created', 'passengers_added', 'payment_pending'):
    #     booking.expires_at = calc_new_expiry(to_status, now)  # реализовать: разные TTL по этапам
    # else:
    #     booking.expires_at = None

    # # append в JSONB историю (в приложении: читаем список и добавляем запись)
    # history = list(booking.status_history or [])
    # entry = {'status': to_status, 'at': now.isoformat().replace('+00:00','Z')}
    # if by: entry['by'] = by
    # if reason: entry['reason'] = reason
    # if meta: entry['meta'] = meta
    # history.append(entry)
    # booking.status_history = history

    # db.session.add(booking)
    # db.session.commit()

    # return booking

    # def calc_new_expiry(stage: str, now):
    # # пример: 20 минут на ввод пассажиров, 15 минут на оплату
    # ttl_map = {
    #     'created': 1200,
    #     'passengers_added': 900,
    #     'payment_pending': 900,
    # }
    # seconds = ttl_map.get(stage)
    # return None if seconds is None else now + timedelta(seconds=seconds)
