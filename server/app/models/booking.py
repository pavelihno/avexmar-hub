from database import db
from models.base_model import BaseModel
from config import Config


booking_seats = db.Table(
    'booking_seats',
    db.Column('booking_id', db.Integer, db.ForeignKey('bookings.id'), primary_key=True),
    db.Column('seat_id', db.Integer, db.ForeignKey('seats.id'), primary_key=True),
)

class Booking(BaseModel):
    __tablename__ = 'bookings'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id'), nullable=False)
    booked_at = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)

    base_price = db.Column(db.Float, nullable=False)
    tax_amount = db.Column(db.Float, nullable=False, default=0.0)
    discount_amount = db.Column(db.Float, nullable=False, default=0.0)
    final_price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(), nullable=False, default=Config.DEFAULT_CURRENCY, server_default=Config.DEFAULT_CURRENCY)

    flight = db.relationship('Flight', backref='bookings')
    seats = db.relationship('Seat', secondary=booking_seats, backref='bookings')

    def to_dict(self):
        return {
            'id': self.id,
            'flight_id': self.flight_id,
            'seat_ids': [seat.id for seat in self.seats],
            'booked_at': self.booked_at,
            'base_price': float(self.base_price) if self.base_price is not None else None,
            'tax_amount': float(self.tax_amount) if self.tax_amount is not None else None,
            'discount_amount': float(self.discount_amount) if self.discount_amount is not None else None,
            'final_price': float(self.final_price) if self.final_price is not None else None,
            'currency': self.currency
        }
