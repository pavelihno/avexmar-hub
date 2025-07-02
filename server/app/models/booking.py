from database import db
from models._base_model import BaseModel
from config import Config


class Booking(BaseModel):
    __tablename__ = 'bookings'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='RESTRICT'), nullable=False)
    booked_at = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)

    base_price = db.Column(db.Float, nullable=False)
    tax_amount = db.Column(db.Float, nullable=False, default=0.0)
    discount_amount = db.Column(db.Float, nullable=False, default=0.0)
    final_price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(), nullable=False, default=Config.DEFAULT_CURRENCY, server_default=Config.DEFAULT_CURRENCY)

    payments = db.relationship('Payment', backref='booking', lazy='dynamic', cascade='all, delete-orphan')
    seats = db.relationship('Seat', backref='booking', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'flight_id': self.flight_id,
            'booked_at': self.booked_at,
            'base_price': self.base_price,
            'tax_amount': self.tax_amount,
            'discount_amount': self.discount_amount,
            'final_price': self.final_price,
            'currency': self.currency
        }
