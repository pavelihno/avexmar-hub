from typing import TYPE_CHECKING, Dict, Any
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel, ModelValidationError
from app.models.booking_passenger import BookingPassenger
from app.constants.messages import TicketMessages

if TYPE_CHECKING:
    from app.models.flight import Flight

class Ticket(BaseModel):
    __tablename__ = 'tickets'

    ticket_number = db.Column(db.String(20), unique=True, nullable=False)

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    booking_passenger_id = db.Column(db.Integer, db.ForeignKey('booking_passengers.id', ondelete='CASCADE'), nullable=True)

    flight: Mapped['Flight'] = db.relationship('Flight', back_populates='tickets')
    booking_passenger: Mapped['BookingPassenger'] = db.relationship('BookingPassenger', back_populates='tickets')

    @staticmethod
    def prepare_relationships(data: Dict[str, Any]) -> Dict[str, Any]:
        payload = dict(data or {})
        booking_id = payload.pop('booking_id', None)
        passenger_id = payload.pop('passenger_id', None)

        if booking_id is None and passenger_id is None:
            return payload

        if not booking_id or not passenger_id:
            raise ModelValidationError(
                {
                    'booking_id': TicketMessages.BOOKING_REQUIRED,
                    'passenger_id': TicketMessages.PASSENGER_REQUIRED,
                }
            )

        booking_passenger = BookingPassenger.query.filter_by(
            booking_id=booking_id,
            passenger_id=passenger_id,
        ).first()

        if booking_passenger is None:
            booking_passenger = BookingPassenger.create(
                booking_id=booking_id,
                passenger_id=passenger_id,
            )

        payload['booking_passenger_id'] = booking_passenger.id
        return payload

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'ticket_number': self.ticket_number,
            'flight': self.flight.to_dict(return_children) if return_children else {},
            'flight_id': self.flight_id,
            'booking_passenger': (
                self.booking_passenger.to_dict(return_children)
                if self.booking_passenger and return_children
                else {}
            ),
            'booking_passenger_id': self.booking_passenger_id,
            'booking_id': self.booking_passenger.booking_id if self.booking_passenger else None,
            'passenger_id': self.booking_passenger.passenger_id if self.booking_passenger else None,
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='ticket_number', descending=False)

    @classmethod
    def create(cls, session=None, *, commit=False, **data):
        prepared = cls.prepare_relationships(data)
        return super().create(session=session, commit=commit, **prepared)

    @classmethod
    def update(cls, _id, session=None, *, commit=False, **data):
        prepared = cls.prepare_relationships(data)
        return super().update(_id, session=session, commit=commit, **prepared)
