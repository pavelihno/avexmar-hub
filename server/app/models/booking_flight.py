from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.flight import Flight


class BookingFlight(BaseModel):
    __tablename__ = 'booking_flights'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id'), nullable=False)

    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='booking_flights')
    flight: Mapped['Flight'] = db.relationship('Flight', back_populates='booking_flights')

    __table_args__ = (
        db.UniqueConstraint(
            'booking_id', 'flight_id',
            name='uix_booking_flight_unique'
        ),
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'booking': self.booking.to_dict(return_children) if return_children else {},
            'booking_id': self.booking_id,
            'flight': self.flight.to_dict(return_children) if return_children else {},
            'flight_id': self.flight_id,
        }
