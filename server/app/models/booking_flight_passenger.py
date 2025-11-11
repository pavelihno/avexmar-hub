from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.utils.enum import (
    BOOKING_FLIGHT_PASSENGER_STATUS,
    DEFAULT_BOOKING_FLIGHT_PASSENGER_STATUS,
)

if TYPE_CHECKING:
    from app.models.booking_passenger import BookingPassenger
    from app.models.flight import Flight
    from app.models.ticket import Ticket


class BookingFlightPassenger(BaseModel):
    __tablename__ = 'booking_flight_passengers'

    booking_passenger_id = db.Column(
        db.Integer,
        db.ForeignKey('booking_passengers.id', ondelete='CASCADE'),
        nullable=False,
    )
    flight_id = db.Column(
        db.Integer,
        db.ForeignKey('flights.id', ondelete='CASCADE'),
        nullable=False,
    )
    status = db.Column(
        db.Enum(BOOKING_FLIGHT_PASSENGER_STATUS),
        nullable=False,
        default=DEFAULT_BOOKING_FLIGHT_PASSENGER_STATUS,
    )

    booking_passenger: Mapped['BookingPassenger'] = db.relationship(
        'BookingPassenger',
        back_populates='booking_flight_passengers',
    )
    flight: Mapped['Flight'] = db.relationship(
        'Flight',
        back_populates='booking_flight_passengers',
    )
    ticket: Mapped['Ticket'] = db.relationship(
        'Ticket',
        back_populates='booking_flight_passenger',
    )

    __table_args__ = (
        db.UniqueConstraint(
            'booking_passenger_id',
            'flight_id',
            name='uix_booking_flight_passenger_unique',
        ),
    )

    def to_dict(self, return_children: bool = False):
        return {
            'id': self.id,
            'booking_passenger_id': self.booking_passenger_id,
            'booking_passenger': (
                self.booking_passenger.to_dict(return_children)
                if return_children and self.booking_passenger
                else {}
            ),
            'flight_id': self.flight_id,
            'flight': (
                self.flight.to_dict(return_children)
                if return_children and self.flight
                else {}
            ),
            'status': self.status.value if self.status else None,
        }
