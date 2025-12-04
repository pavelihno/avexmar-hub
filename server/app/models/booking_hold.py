from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.constants.models import ModelVerboseNames

if TYPE_CHECKING:
    from app.models.booking import Booking


class BookingHold(BaseModel):
    __tablename__ = 'booking_holds'
    __verbose_name__ = ModelVerboseNames.BookingHold

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)

    booking: Mapped['Booking'] = db.relationship(
        'Booking', back_populates='booking_hold', uselist=False
    )

    @property
    def flights(self):
        return self.booking.flights if self.booking else []

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'booking': (
                self.booking.to_dict(return_children) if return_children else {}
            ),
            'booking_id': self.booking_id,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
        }

    @classmethod
    def set_hold(
        cls,
        booking_id,
        expires_at,
        session=None,
        *,
        commit=False,
    ):
        session = session or db.session
        hold = cls.query.filter_by(booking_id=booking_id).first()
        if hold:
            return cls.update(
                hold.id,
                session=session,
                commit=commit,
                expires_at=expires_at,
            )
        return cls.create(
            session,
            commit=commit,
            booking_id=booking_id,
            expires_at=expires_at,
        )

    @classmethod
    def delete_by_booking_id(
        cls,
        booking_id,
        session=None,
        *,
        commit=False,
    ):
        session = session or db.session
        hold = cls.query.filter_by(booking_id=booking_id).first()
        return cls.delete_or_404(hold.id if hold else None, session=session, commit=commit)
