import random
import string
import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped
from sqlalchemy.dialects.postgresql import UUID

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
    booking_number = db.Column(db.String, unique=True, nullable=False)
    public_id = db.Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True)
    status = db.Column(db.Enum(Config.BOOKING_STATUS), nullable=False, default=Config.DEFAULT_BOOKING_STATUS)

    # Customer details
    email_address = db.Column(db.String, nullable=False)
    phone_number = db.Column(db.String, nullable=False)

    # Price details
    currency = db.Column(db.Enum(Config.CURRENCY), nullable=False, default=Config.DEFAULT_CURRENCY)
    fare_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    total_discounts = db.Column(db.Float, nullable=False, default=0.0)
    fees = db.Column(db.Float, nullable=False, default=0.0)

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
            'booking_number': self.booking_number,
            'public_id': str(self.public_id),
            'booking_date': self.created_at.date().isoformat(),
            'status': self.status.value,
            'email_address': self.email_address,
            'phone_number': self.phone_number,
            'currency': self.currency.value,
            'fare_price': self.fare_price,
            'total_price': self.total_price,
            'total_discounts': self.total_discounts,
            'fees': self.fees
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
