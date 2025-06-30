from database import db
from models.base_model import BaseModel

class Booking(BaseModel):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id'), nullable=False)
    date = db.Column('flight_date', db.Date, nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    seat_class = db.Column(db.String(), nullable=False)
    booked_at = db.Column('booking_time', db.DateTime, default=db.func.current_timestamp())

    __table_args__ = (
        db.CheckConstraint("seat_class IN ('economy', 'business')", name='seat_class_types'),
    )

    flight = db.relationship('Flight', backref='bookings')
    passenger = db.relationship('Passenger', backref='bookings')
