from typing import TYPE_CHECKING
from datetime import datetime

from sqlalchemy.orm import Session, Mapped
from sqlalchemy.dialects.postgresql import JSONB

from app.database import db
from app.models._base_model import BaseModel
from app.constants.models import ModelVerboseNames
from app.utils.enum import (
    PAYMENT_METHOD,
    PAYMENT_STATUS,
    CURRENCY,
    PAYMENT_TYPE,
    DEFAULT_PAYMENT_STATUS,
    DEFAULT_CURRENCY,
    DEFAULT_PAYMENT_TYPE,
)

if TYPE_CHECKING:
    from app.models.booking import Booking


class Payment(BaseModel):
    __tablename__ = 'payments'
    __verbose_name__ = ModelVerboseNames.Payment

    # Payment details
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False)
    payment_method = db.Column(db.Enum(PAYMENT_METHOD), nullable=False)
    payment_status = db.Column(db.Enum(PAYMENT_STATUS), nullable=False, default=DEFAULT_PAYMENT_STATUS)
    payment_type = db.Column(db.Enum(PAYMENT_TYPE), nullable=False, default=DEFAULT_PAYMENT_TYPE)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.Enum(CURRENCY), nullable=False, default=DEFAULT_CURRENCY)
    expires_at = db.Column(db.DateTime, nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)

    # Provider payment details
    provider_payment_id = db.Column(db.String, unique=True)
    confirmation_token = db.Column(db.String)

    # Metadata
    is_paid = db.Column(db.Boolean, default=False, nullable=False)
    status_history = db.Column(JSONB, nullable=False, server_default='[]', default=list)
    last_webhook = db.Column(JSONB)

    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='payments')

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'booking': self.booking.to_dict(return_children) if return_children else {},
            'booking_id': self.booking_id,
            'payment_method': self.payment_method.value,
            'payment_status': self.payment_status.value,
            'payment_type': self.payment_type.value,
            'amount': float(self.amount) if self.amount is not None else None,
            'currency': self.currency.value if self.currency else None,
            'provider_payment_id': self.provider_payment_id,
            'confirmation_token': self.confirmation_token,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'is_paid': self.is_paid,
        }

    @classmethod
    def get_by_provider_payment_id(cls, provider_payment_id: str):
        return cls.query.filter(cls.provider_payment_id == provider_payment_id).first_or_404()

    @classmethod
    def create(
        cls,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session
        kwargs = cls.convert_enums(kwargs)
        status = kwargs.get('payment_status', DEFAULT_PAYMENT_STATUS)
        kwargs['status_history'] = [
            {'status': status.value, 'at': datetime.now().isoformat()}
        ]
        return super().create(session, commit=commit, **kwargs)

    @classmethod
    def update(
        cls,
        _id,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session
        payment = cls.get_or_404(_id, session)
        kwargs = cls.convert_enums(kwargs)
        old_status = payment.payment_status
        new_status = kwargs.get('payment_status', old_status)

        if new_status and new_status != old_status:
            history = list(payment.status_history or [])
            history.append({
                'status': new_status.value,
                'at': datetime.now().isoformat()
            })
            kwargs['status_history'] = history
        return super().update(_id, session=session, commit=commit, **kwargs)
