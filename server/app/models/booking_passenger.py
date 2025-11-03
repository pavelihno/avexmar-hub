from typing import TYPE_CHECKING, List
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.utils.enum import PASSENGER_CATEGORY, PASSENGER_PLURAL_CATEGORY
from app.utils.passenger_categories import (
    DEFAULT_PASSENGER_CATEGORY,
    get_category_from_plural as resolve_category_from_plural,
    get_plural_category as resolve_plural_category,
)

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.passenger import Passenger
    from app.models.ticket import Ticket


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
    tickets: Mapped[List['Ticket']] = db.relationship('Ticket', back_populates='booking_passenger', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint(
            'booking_id', 'passenger_id',
            name='uix_booking_passenger_unique'
        ),
    )

    @classmethod
    def get_plural_category(
        cls, category: PASSENGER_CATEGORY
    ) -> PASSENGER_PLURAL_CATEGORY | None:
        """Return the plural form of the passenger category"""
        return resolve_plural_category(category)

    @classmethod
    def get_category_from_plural(
        cls, plural: PASSENGER_PLURAL_CATEGORY
    ) -> PASSENGER_CATEGORY | None:
        """Return the passenger category from its plural form"""
        return resolve_category_from_plural(plural)

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'booking': self.booking.to_dict(return_children) if return_children else {},
            'booking_id': self.booking_id,
            'passenger': self.passenger.to_dict(return_children) if return_children else {},
            'passenger_id': self.passenger_id,
            'category': self.category.value if self.category else None
        }
