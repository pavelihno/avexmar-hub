from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel

if TYPE_CHECKING:
    from app.models.flight import Flight
    from app.models.booking import Booking
    from app.models.passenger import Passenger
    from app.models.discount import Discount
    from app.models.seat import Seat


class Ticket(BaseModel):
    __tablename__ = 'tickets'

    ticket_number = db.Column(db.String(20), unique=True, nullable=False)

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=True)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id', ondelete='SET NULL'), nullable=True)
    discount_id = db.Column(db.Integer, db.ForeignKey('discounts.id', ondelete='SET NULL'), nullable=True)
    seat_id = db.Column(db.Integer, db.ForeignKey('seats.id', ondelete='CASCADE'), nullable=True, unique=True)

    flight: Mapped['Flight'] = db.relationship('Flight', back_populates='tickets')
    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='tickets')
    passenger: Mapped['Passenger'] = db.relationship('Passenger', back_populates='tickets')
    discount: Mapped['Discount'] = db.relationship('Discount', back_populates='tickets')
    seat: Mapped['Seat'] = db.relationship('Seat', back_populates='ticket', uselist=False)

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'ticket_number': self.ticket_number,
            'flight': self.flight.to_dict() if return_children else {},
            'flight_id': self.flight_id,
            'booking': self.booking.to_dict() if self.booking_id and return_children else {},
            'booking_id': self.booking_id,
            'passenger': self.passenger.to_dict() if self.passenger_id and return_children else {},
            'passenger_id': self.passenger_id,
            'discount': self.discount.to_dict() if self.discount_id and return_children else {},
            'discount_id': self.discount_id,
            'seat': self.seat.to_dict() if self.seat_id and return_children else {},
            'seat_id': self.seat_id,
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='ticket_number', descending=False)
