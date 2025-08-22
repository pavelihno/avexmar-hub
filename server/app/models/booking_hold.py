from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel

if TYPE_CHECKING:
    from app.models.booking_flight import BookingFlight


class BookingHold(BaseModel):
    __tablename__ = 'booking_holds'

    id = db.Column(db.Integer, primary_key=True)
    booking_flight_id = db.Column(db.Integer, db.ForeignKey('booking_flights.id', ondelete='CASCADE'), nullable=False, index=True, unique=True)
    seat_number = db.Column(db.Integer, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    booking_flight: Mapped['BookingFlight'] = db.relationship('BookingFlight', back_populates='booking_holds')
