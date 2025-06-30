from database import db
from models.base_model import BaseModel


class FlightAvailability(BaseModel):
    __tablename__ = 'flight_availability'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id'), nullable=False)
    date = db.Column('flight_date', db.Date, nullable=False)
    available_economy_seats = db.Column('economy_seats', db.Integer, default=0)
    available_business_seats = db.Column('business_seats', db.Integer, default=0)
    updated_at = db.Column('last_updated', db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    flight = db.relationship('Flight', backref='availabilities')
