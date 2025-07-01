from database import db
from models.base_model import BaseModel
from config import Config


class Seat(BaseModel):
    __tablename__ = 'seats'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id'), nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    seat_number = db.Column(db.String(10), nullable=False)
    seat_class = db.Column(db.String(), nullable=False)

    flight = db.relationship('Flight', backref='seats')
    passenger = db.relationship('Passenger', backref='seats')

    __table_args__ = (
        db.CheckConstraint(seat_class.in_(Config.ENUM_SEAT_CLASS), name='seat_class_types'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'flight_id': self.flight_id,
            'passenger_id': self.passenger_id,
            'seat_number': self.seat_number,
            'seat_class': self.seat_class
        }
