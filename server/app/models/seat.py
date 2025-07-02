from database import db
from models._base_model import BaseModel


class Seat(BaseModel):
    __tablename__ = 'seats'

    seat_number = db.Column(db.String(10), nullable=False)
    tariff_id = db.Column(db.Integer, db.ForeignKey('tariffs.id', ondelete='CASCADE'), nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id', ondelete='RESTRICT'), nullable=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='SET NULL'), nullable=True)

    __table_args__ = (
        db.UniqueConstraint('tariff_id', 'seat_number'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'seat_number': self.seat_number,
            'tariff_id': self.tariff_id,
            'passenger_id': self.passenger_id,
            'booking_id': self.booking_id
        }
