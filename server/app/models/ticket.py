from app.database import db
from app.models._base_model import BaseModel


class Ticket(BaseModel):
    __tablename__ = 'tickets'

    ticket_number = db.Column(db.String(20), unique=True, nullable=False)

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=True)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id', ondelete='SET NULL'), nullable=True)
    discount_id = db.Column(db.Integer, db.ForeignKey('discounts.id', ondelete='SET NULL'), nullable=True)
    seat_id = db.Column(db.Integer, db.ForeignKey('seats.id', ondelete='CASCADE'), nullable=True, unique=True)

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_number': self.ticket_number,
            'flight_id': self.flight_id,
            'booking_id': self.booking_id,
            'passenger_id': self.passenger_id,
            'discount_id': self.discount_id,
            'seat_id': self.seat_id
        }
