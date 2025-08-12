from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.config import Config

if TYPE_CHECKING:
    from app.models.booking import Booking


class Payment(BaseModel):
    __tablename__ = 'payments'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False)
    payment_method = db.Column(db.Enum(Config.PAYMENT_METHOD), nullable=False)
    payment_status = db.Column(db.Enum(Config.PAYMENT_STATUS), nullable=False, default=Config.DEFAULT_PAYMENT_STATUS)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.Enum(Config.CURRENCY), nullable=False, default=Config.DEFAULT_CURRENCY)
    provider_payment_id = db.Column(db.String(100), unique=True)
    confirmation_token = db.Column(db.String(255))

    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='payments')

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'booking': self.booking.to_dict(return_children) if return_children else {},
            'booking_id': self.booking_id,
            'payment_method': self.payment_method.value,
            'payment_status': self.payment_status.value,
            'amount': float(self.amount) if self.amount is not None else None,
            'currency': self.currency.value if self.currency else None,
            'provider_payment_id': self.provider_payment_id,
            'confirmation_token': self.confirmation_token,
        }
