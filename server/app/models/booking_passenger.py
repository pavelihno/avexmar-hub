from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.models._base_model import ModelValidationError

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.passenger import Passenger

class BookingPassenger(BaseModel):
    __tablename__ = 'booking_passengers'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    is_contact = db.Column(db.Boolean, default=False, nullable=False)

    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='booking_passengers')
    passenger: Mapped['Passenger'] = db.relationship('Passenger', back_populates='booking_passengers')

    __table_args__ = (
        db.UniqueConstraint(
            'booking_id', 'passenger_id',
            name='uix_booking_passenger_unique'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'passenger_id': self.passenger_id,
            'is_contact': self.is_contact
        }

    @classmethod
    def __check_is_contact_unique(cls, session, booking_id, instance_id=None):
        """Ensure only one contact passenger per booking"""
        query = session.query(cls).filter_by(booking_id=booking_id, is_contact=True)
        if instance_id is not None:
            query = query.filter(cls.id != instance_id)
        if query.first() is not None:
            raise ModelValidationError({'is_contact': 'only one contact passenger per booking allowed'})

    @classmethod
    def create(cls, session=None, **data):
        session = session or db.session
        booking_id = data.get('booking_id')
        if booking_id is not None and data.get('is_contact'):
            cls.__check_is_contact_unique(session, booking_id)
        return super().create(session, **data)

    @classmethod
    def update(cls, _id, session=None, **data):
        session = session or db.session
        instance = cls.get_or_404(_id, session)
        booking_id = data.get('booking_id', instance.booking_id)
        if booking_id is not None and data.get('is_contact'):
            cls.__check_is_contact_unique(session, booking_id, instance_id=_id)

        return super().update(_id, session, **data)
