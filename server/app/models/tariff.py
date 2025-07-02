from database import db
from models._base_model import BaseModel
from config import Config


class Tariff(BaseModel):
    __tablename__ = 'tariffs'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    seat_class = db.Column(db.String(), nullable=False)
    price = db.Column(db.Float, nullable=False)
    seats_number = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(), nullable=False, default=Config.DEFAULT_CURRENCY, server_default=Config.DEFAULT_CURRENCY)

    seats = db.relationship('Seat', backref='tariff', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.CheckConstraint(seat_class.in_(Config.ENUM_SEAT_CLASS), name='tariff_seat_class_types'),
        db.CheckConstraint(currency.in_(Config.ENUM_CURRENCY), name='tariff_currency_types'),
        db.UniqueConstraint('flight_id', 'seat_class', name='unique_flight_seat_class'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'flight_id': self.flight_id,
            'seat_class': self.seat_class,
            'price': self.price,
            'seats_number': self.seats_number,
            'currency': self.currency
        }