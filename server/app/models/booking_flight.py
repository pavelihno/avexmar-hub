from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.flight_tariff import FlightTariff


class BookingFlight(BaseModel):
    __tablename__ = 'booking_flights'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    flight_tariff_id = db.Column(db.Integer, db.ForeignKey('flight_tariffs.id'), nullable=False)
    seats_number = db.Column(db.Integer, nullable=False, default=0)
    itinerary_receipt_path = db.Column(db.String, nullable=True)

    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='booking_flights')
    flight_tariff: Mapped['FlightTariff'] = db.relationship('FlightTariff', back_populates='booking_flights')

    __table_args__ = (
        db.UniqueConstraint(
            'booking_id', 'flight_tariff_id',
            name='uix_booking_flight_unique'
        ),
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'booking': self.booking.to_dict(return_children) if return_children else {},
            'booking_id': self.booking_id,
            'flight_tariff': self.flight_tariff.to_dict(return_children) if self.flight_tariff and return_children else {},
            'flight_tariff_id': self.flight_tariff_id,
            'seats_number': self.seats_number,
        }
