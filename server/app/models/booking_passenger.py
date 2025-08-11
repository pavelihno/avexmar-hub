from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.models._base_model import ModelValidationError
from app.config import Config

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.passenger import Passenger

class BookingPassenger(BaseModel):
    __tablename__ = 'booking_passengers'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    category = db.Column(
        db.Enum(Config.PASSENGER_CATEGORY),
        default=Config.DEFAULT_PASSENGER_CATEGORY,
        nullable=False,
    )

    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='booking_passengers')
    passenger: Mapped['Passenger'] = db.relationship('Passenger', back_populates='booking_passengers')

    __table_args__ = (
        db.UniqueConstraint(
            'booking_id', 'passenger_id',
            name='uix_booking_passenger_unique'
        ),
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'booking': self.booking.to_dict(return_children) if return_children else {},
            'booking_id': self.booking_id,
            'passenger': self.passenger.to_dict(return_children) if return_children else {},
            'passenger_id': self.passenger_id,
            'category': self.category.value if self.category else None
        }
