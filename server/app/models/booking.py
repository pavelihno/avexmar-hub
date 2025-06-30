from database import db
from models.base_model import BaseModel


class Booking(BaseModel):
    __tablename__ = 'bookings'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id'), nullable=False)
    date = db.Column('flight_date', db.Date, nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    seat_class = db.Column(db.String(), nullable=False)
    booked_at = db.Column('booking_time', db.DateTime, default=db.func.current_timestamp())

    __table_args__ = (
        db.CheckConstraint(seat_class.in_(['economy', 'business']), name='seat_class_types'),
    )

    flight = db.relationship('Flight', backref='bookings')
    passenger = db.relationship('Passenger', backref='bookings')

    def to_dict(self):
        return {
            'id': self.id,
            'flight_id': self.flight_id,
            'date': self.date,
            'passenger_id': self.passenger_id,
            'seat_class': self.seat_class,
            'booked_at': self.booked_at
        }

    @classmethod
    def create(cls, **data):
        booking = cls(**data)
        db.session.add(booking)
        db.session.commit()
        return booking

    @classmethod
    def update(cls, _id, **data):
        booking = cls.get_by_id(_id)
        if booking:
            for key, value in data.items():
                if hasattr(booking, key):
                    setattr(booking, key, value)
            db.session.commit()
            return booking
        return None
