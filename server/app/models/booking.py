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
from app.config import Config

if TYPE_CHECKING:
    from app.models.payment import Payment
    from app.models.ticket import Ticket
    from app.models.seat import Seat
    from app.models.booking_passenger import BookingPassenger
    from app.models.booking_flight import BookingFlight


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

    # Metadata
    passenger_counts = db.Column(JSONB, nullable=False, server_default='{}', default=dict)

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
                for ch in Config.PNR_MASK
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
        status = kwargs.get('status', Config.DEFAULT_BOOKING_STATUS)
        history = kwargs.get('status_history', [])
        if not history:
            history = [{
                'status': status.value if hasattr(status, 'value') else str(status),
                'at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            }]
        kwargs['status_history'] = history
        return super().create(session, **kwargs)

    ALLOWED_TRANSITIONS = {
        'created': {'passengers_added', 'cancelled', 'expired'},
        'passengers_added': {'payment_pending', 'cancelled', 'expired'},
        'payment_pending': {'payment_confirmed', 'payment_failed', 'cancelled', 'expired'},
        'payment_failed': {'payment_pending', 'cancelled', 'expired'},
        'payment_confirmed': {'completed', 'cancelled'},
        'completed': {'cancelled'},
        'expired': set(),
        'cancelled': set(),
    }

    TERMINAL = {'expired', 'cancelled'}

    PAGE_FLOW = {
        'created': ['passengers'],
        'passengers_added': ['passengers', 'confirmation', 'payment'],
        'payment_pending': ['passengers', 'confirmation', 'payment'],
        'payment_failed': ['passengers', 'confirmation', 'payment'],
        'payment_confirmed': ['passengers', 'confirmation', 'payment', 'completion'],
        'completed': ['passengers', 'confirmation', 'payment', 'completion'],
    }

    def get_accessible_pages(self):
        return self.PAGE_FLOW.get(self.status.value, [])

    def transition_status(self, to_status: str, session: Session | None = None):
        session = session or db.session
        from_status = self.status.value
        if to_status not in self.ALLOWED_TRANSITIONS.get(from_status, set()):
            raise ValueError(f'Illegal transition: {from_status} -> {to_status}')

        self.status = Config.BOOKING_STATUS[to_status]
        history = list(self.status_history or [])
        history.append({
            'status': to_status,
            'at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        })
        self.status_history = history
        session.add(self)
        session.commit()
        return self
