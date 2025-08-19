from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.utils.enum import PASSENGER_CATEGORY, DEFAULT_PASSENGER_CATEGORY, PASSENGER_PLURAL_CATEGORY

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.passenger import Passenger

class BookingPassenger(BaseModel):
    __tablename__ = 'booking_passengers'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    category = db.Column(
        db.Enum(PASSENGER_CATEGORY),
        default=DEFAULT_PASSENGER_CATEGORY,
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

    PASSENGER_CATEGORY_PAIRS = [
        (PASSENGER_CATEGORY.adult, PASSENGER_PLURAL_CATEGORY.adults),
        (PASSENGER_CATEGORY.child, PASSENGER_PLURAL_CATEGORY.children),
        (PASSENGER_CATEGORY.infant, PASSENGER_PLURAL_CATEGORY.infants),
        (PASSENGER_CATEGORY.infant_seat, PASSENGER_PLURAL_CATEGORY.infants_seat),
    ]

    @classmethod
    def get_plural_category(cls, category: PASSENGER_CATEGORY) -> PASSENGER_PLURAL_CATEGORY:
        """Return the plural form of the passenger category"""
        return dict((k, v) for k, v in cls.PASSENGER_CATEGORY_PAIRS).get(category, None)

    @classmethod
    def get_category_from_plural(cls, plural: PASSENGER_PLURAL_CATEGORY) -> PASSENGER_CATEGORY:
        """Return the passenger category from its plural form"""
        return dict((v, k) for k, v in cls.PASSENGER_CATEGORY_PAIRS).get(plural, None)

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'booking': self.booking.to_dict(return_children) if return_children else {},
            'booking_id': self.booking_id,
            'passenger': self.passenger.to_dict(return_children) if return_children else {},
            'passenger_id': self.passenger_id,
            'category': self.category.value if self.category else None
        }
