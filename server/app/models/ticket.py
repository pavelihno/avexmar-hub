from typing import TYPE_CHECKING, Dict, Any
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel, ModelValidationError
from app.models.booking_flight_passenger import BookingFlightPassenger
from app.constants.messages import TicketMessages

if TYPE_CHECKING:
    from app.models.booking_flight_passenger import BookingFlightPassenger


class Ticket(BaseModel):
    __tablename__ = 'tickets'

    ticket_number = db.Column(db.String(20), unique=True, nullable=False)

    booking_flight_passenger_id = db.Column(
        db.Integer,
        db.ForeignKey('booking_flight_passengers.id', ondelete='CASCADE'),
        nullable=False,
    )
    booking_flight_passenger: Mapped['BookingFlightPassenger'] = db.relationship(
        'BookingFlightPassenger',
        back_populates='tickets',
    )

    @property
    def flight(self):
        return self.booking_flight_passenger.flight if self.booking_flight_passenger else None

    @property
    def booking_passenger(self):
        return (
            self.booking_flight_passenger.booking_passenger
            if self.booking_flight_passenger
            else None
        )

    @staticmethod
    def prepare_relationships(data: Dict[str, Any]) -> Dict[str, Any]:
        payload = dict(data or {})
        booking_flight_passenger_id = payload.get(
            'booking_flight_passenger_id'
        )

        if not booking_flight_passenger_id:
            raise ModelValidationError(
                {'booking_flight_passenger_id': TicketMessages.BOOKING_FLIGHT_PASSENGER_REQUIRED}
            )

        BookingFlightPassenger.get_or_404(booking_flight_passenger_id)

        return payload

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'ticket_number': self.ticket_number,
            'booking_flight_passenger_id': self.booking_flight_passenger_id,
            'flight_id': self.flight.id if self.flight else None,
            'booking_passenger_id': self.booking_passenger.id if self.booking_passenger else None,
            'booking_id': self.booking_passenger.booking_id if self.booking_passenger else None,
            'passenger_id': self.booking_passenger.passenger_id if self.booking_passenger else None
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
