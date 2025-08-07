from typing import TYPE_CHECKING
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.flight_tariff import FlightTariff
    from app.models.ticket import Ticket


class Seat(BaseModel):
    __tablename__ = 'seats'

    seat_number = db.Column(db.String(10), nullable=False)

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='SET NULL'), nullable=True)
    tariff_id = db.Column(db.Integer, db.ForeignKey('flight_tariffs.id', ondelete='RESTRICT'), nullable=False)

    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='seats')
    tariff: Mapped['FlightTariff'] = db.relationship('FlightTariff', back_populates='seats')
    ticket: Mapped['Ticket'] = db.relationship('Ticket', back_populates='seat', uselist=False)

    __table_args__ = (
        db.UniqueConstraint(
            'tariff_id', 'seat_number', 
            name='uix_tariff_seat_number'
        ),
    )

    @hybrid_property
    def is_booked(self):
        """Return True if the seat is associated with a booking"""
        return self.booking_id is not None

    def to_dict(self):
        return {
            'id': self.id,
            'seat_number': self.seat_number,
            'booking_id': self.booking_id,
            'tariff_id': self.tariff_id,
            'is_booked': self.is_booked
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['seat_number'], descending=False) 
