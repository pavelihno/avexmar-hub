from typing import TYPE_CHECKING, List
from sqlalchemy.orm import Mapped
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import joinedload

from app.database import db
from app.models._base_model import BaseModel
from app.constants.models import ModelVerboseNames
from app.models.passenger import Passenger
from app.utils.enum import PASSENGER_CATEGORY, PASSENGER_PLURAL_CATEGORY
from app.utils.passenger_categories import (
    DEFAULT_PASSENGER_CATEGORY,
    get_category_from_plural as resolve_category_from_plural,
    get_plural_category as resolve_plural_category,
)

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.ticket import Ticket
    from app.models.booking_flight_passenger import BookingFlightPassenger


class BookingPassenger(BaseModel):
    __tablename__ = 'booking_passengers'
    __verbose_name__ = ModelVerboseNames.BookingPassenger

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    category = db.Column(
        db.Enum(PASSENGER_CATEGORY),
        default=DEFAULT_PASSENGER_CATEGORY,
        nullable=False,
    )
    passenger_snapshot = db.Column(JSONB, nullable=True)

    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='booking_passengers')
    passenger: Mapped['Passenger'] = db.relationship('Passenger', back_populates='booking_passengers')
    booking_flight_passengers: Mapped[List['BookingFlightPassenger']] = db.relationship(
        'BookingFlightPassenger',
        back_populates='booking_passenger',
        lazy='dynamic',
        cascade='all, delete-orphan',
    )
    tickets: Mapped[List['Ticket']] = db.relationship(
        'Ticket',
        secondary='booking_flight_passengers',
        primaryjoin='BookingPassenger.id == BookingFlightPassenger.booking_passenger_id',
        secondaryjoin='Ticket.booking_flight_passenger_id == BookingFlightPassenger.id',
        viewonly=True,
        lazy='dynamic',
    )

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

    def build_passenger_snapshot(self) -> dict | None:
        """Serialize the linked passenger into a snapshot payload"""
        passenger = self.passenger
        if not passenger:
            return None

        citizenship = passenger.citizenship.to_dict(return_children=True) if passenger.citizenship else {}

        return {
            'id': passenger.id,
            'first_name': passenger.first_name,
            'last_name': passenger.last_name,
            'patronymic_name': passenger.patronymic_name,
            'gender': passenger.gender.value if passenger.gender else None,
            'birth_date': passenger.birth_date.isoformat() if passenger.birth_date else None,
            'document_type': passenger.document_type.value if passenger.document_type else None,
            'document_number': passenger.document_number,
            'document_expiry_date': passenger.document_expiry_date.isoformat() if passenger.document_expiry_date else None,
            'citizenship': {
                'id': citizenship.get('id'),
                'name': citizenship.get('name'),
                'code_a3': citizenship.get('code_a3'),
            },
            'citizenship_id': passenger.citizenship_id,
            'deleted': bool(passenger.deleted),
        }

    def get_passenger_details(self) -> dict:
        """Return passenger details preferring stored snapshot"""
        if self.passenger_snapshot:
            return dict(self.passenger_snapshot)
        if self.passenger:
            return self.passenger.to_dict(return_children=True)
        return {}

    @classmethod
    def save_passenger_snapshot(
        cls,
        booking_id: int,
        session=None,
        *,
        commit: bool = False,
    ):
        """Persist passenger snapshots for all passengers in a booking"""
        session = session or db.session

        booking_passengers = (
            session.query(cls)
            .options(joinedload(cls.passenger).joinedload(Passenger.citizenship))
            .filter(cls.booking_id == booking_id)
            .all()
        )

        for bp in booking_passengers:
            bp.passenger_snapshot = bp.build_passenger_snapshot()

        if commit:
            session.commit()
        else:
            session.flush()

        return booking_passengers

    def to_dict(self, return_children=False):
        passenger_data = self.get_passenger_details() if return_children else {}

        return {
            'id': self.id,
            'booking': self.booking.to_dict(return_children) if return_children else {},
            'booking_id': self.booking_id,
            'passenger': passenger_data,
            'passenger_snapshot': self.passenger_snapshot if return_children else None,
            'passenger_id': self.passenger_id,
            'category': self.category.value if self.category else None
        }
