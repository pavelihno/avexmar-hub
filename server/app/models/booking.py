import random
import string
import uuid
from uuid import UUID as UUID_cls
from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped
from sqlalchemy.dialects.postgresql import UUID, JSONB

from datetime import datetime, timezone

from app.database import db
from app.models._base_model import BaseModel
from app.utils.enum import BOOKING_STATUS, CURRENCY, DEFAULT_BOOKING_STATUS, DEFAULT_CURRENCY

if TYPE_CHECKING:
    from app.models.payment import Payment
    from app.models.ticket import Ticket
    from app.models.seat import Seat
    from app.models.booking_passenger import BookingPassenger
    from app.models.booking_flight import BookingFlight
    from app.models.user import User


class Booking(BaseModel):
    __tablename__ = 'bookings'

    # Booking details
    public_id = db.Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True)
    booking_number = db.Column(db.String, unique=True, nullable=True, index=True)
    status = db.Column(db.Enum(BOOKING_STATUS), nullable=False, default=DEFAULT_BOOKING_STATUS)
    status_history = db.Column(JSONB, nullable=False, server_default='[]', default=list)

    # Customer details
    buyer_last_name = db.Column(db.String, nullable=True)
    buyer_first_name = db.Column(db.String, nullable=True)
    email_address = db.Column(db.String, nullable=True)
    phone_number = db.Column(db.String, nullable=True)

    # Price details
    currency = db.Column(db.Enum(CURRENCY), nullable=False, default=DEFAULT_CURRENCY)
    fare_price = db.Column(db.Float, nullable=False)
    fees = db.Column(db.Float, nullable=False, default=0.0)
    total_discounts = db.Column(db.Float, nullable=False, default=0.0)
    total_price = db.Column(db.Float, nullable=False)

    # Metadata
    passenger_counts = db.Column(JSONB, nullable=False, server_default='{}', default=dict)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)

    # Relationships
    user: Mapped['User'] = db.relationship('User', back_populates='bookings')
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
    booking_flights: Mapped[List['BookingFlight']] = db.relationship(
        'BookingFlight', back_populates='booking', lazy='dynamic', cascade='all, delete-orphan'
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'public_id': str(self.public_id),
            'booking_number': self.booking_number,
            'booking_date': self.created_at.date().isoformat(),
            'status': self.status.value,
            'buyer_last_name': self.buyer_last_name,
            'buyer_first_name': self.buyer_first_name,
            'email_address': self.email_address,
            'phone_number': self.phone_number,
            'currency': self.currency.value,
            'fare_price': self.fare_price,
            'total_discounts': self.total_discounts,
            'fees': self.fees,
            'total_price': self.total_price,
        }

    PNR_MASK = 'ABXXXX'

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['booking_number'], descending=False)

    @classmethod
    def get_by_public_id(cls, public_id):
        return cls.query.filter_by(public_id=UUID_cls(str(public_id))).first_or_404()

    @classmethod
    def generate_booking_number(cls, id, session: Session):
        """Generates a unique booking number (PNR - Passenger Name Record)"""
        existing_booking_numbers = {
            booking.booking_number for booking in session.query(cls).all()
        }
        booking_number = None
        while True:
            booking_number = ''.join(
                random.choice(string.ascii_uppercase + string.digits)
                if ch == 'X' else ch
                for ch in cls.PNR_MASK
            )
            if booking_number not in existing_booking_numbers:
                break

        return cls.update(
            id,
            session=session,
            booking_number=booking_number
        )

    @classmethod
    def create(cls, session: Session | None = None, **kwargs):
        session = session or db.session
        status = kwargs.get('status', DEFAULT_BOOKING_STATUS)
        if isinstance(status, str):
            try:
                status_enum = BOOKING_STATUS(status)
            except ValueError:
                status_enum = DEFAULT_BOOKING_STATUS
        elif isinstance(status, BOOKING_STATUS):
            status_enum = status
        else:
            status_enum = DEFAULT_BOOKING_STATUS
        kwargs['status'] = status_enum
        history = [{
            'status': status_enum.value,
            'at': datetime.now().isoformat()
        }]
        kwargs['status_history'] = history
        return super().create(session, **kwargs)

    @classmethod
    def update(cls, id, session: Session | None = None, **kwargs):
        session = session or db.session
        booking = cls.get_or_404(id, session)
        old_status_enum = booking.status
        new_status = kwargs.get('status', old_status_enum)
        if isinstance(new_status, str):
            new_status_enum = BOOKING_STATUS(new_status)
        else:
            new_status_enum = new_status
        history = list(booking.status_history or [])
        history.append({
            'status': new_status_enum.value,
            'at': datetime.now().isoformat()
        })
        kwargs['status_history'] = history
        kwargs['status'] = new_status_enum
        return super().update(id, session=session, **kwargs)

    @classmethod
    def update_by_public_id(cls, public_id, session: Session | None = None, **kwargs):
        session = session or db.session
        booking = cls.get_by_public_id(public_id)
        return cls.update(booking.id, session=session, **kwargs)

    ALLOWED_TRANSITIONS = {
        BOOKING_STATUS.created: {
            BOOKING_STATUS.passengers_added,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.passengers_added: {
            BOOKING_STATUS.confirmed,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.confirmed: {
            BOOKING_STATUS.payment_pending,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.payment_pending: {
            BOOKING_STATUS.payment_confirmed,
            BOOKING_STATUS.payment_failed,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.payment_failed: {
            BOOKING_STATUS.payment_pending,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.payment_confirmed: {
            BOOKING_STATUS.completed,
            BOOKING_STATUS.cancelled,
        },
        BOOKING_STATUS.completed: {BOOKING_STATUS.cancelled},
        BOOKING_STATUS.expired: set(),
        BOOKING_STATUS.cancelled: set(),
    }

    TERMINAL = {BOOKING_STATUS.expired, BOOKING_STATUS.cancelled}

    PAGE_FLOW = {
        BOOKING_STATUS.created: ['passengers'],
        BOOKING_STATUS.passengers_added: ['passengers', 'confirmation'],
        BOOKING_STATUS.confirmed: ['confirmation', 'payment'],
        BOOKING_STATUS.payment_pending: ['payment'],
        BOOKING_STATUS.payment_failed: ['payment'],
        BOOKING_STATUS.payment_confirmed: ['payment', 'completion'],
        BOOKING_STATUS.completed: ['completion'],
    }

    @classmethod
    def get_accessible_pages(cls, current_user, public_id):
        booking = cls.get_by_public_id(public_id)

        if booking.user_id and (not current_user or booking.user_id != current_user.id):
            return []

        return cls.PAGE_FLOW.get(booking.status, [])

    @classmethod
    def transition_status(cls, id, to_status, session: Session | None = None):
        session = session or db.session
        booking = cls.get_or_404(id)
        to_status_enum = (
            BOOKING_STATUS(to_status) if isinstance(
                to_status, str) else to_status
        )
        from_status_enum = booking.status
        if (
            from_status_enum != to_status_enum
            and to_status_enum not in cls.ALLOWED_TRANSITIONS.get(from_status_enum, set())
        ):
            raise ValueError(
                f'Illegal transition: {from_status_enum.value} -> {to_status_enum.value}'
            )

        return cls.update(
            id,
            session=session,
            status=to_status_enum,
        )
