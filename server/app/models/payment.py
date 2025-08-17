from typing import TYPE_CHECKING
from datetime import datetime

from sqlalchemy.orm import Session, Mapped
from sqlalchemy.dialects.postgresql import JSONB

from app.database import db
from app.models._base_model import BaseModel
from app.utils.enum import PAYMENT_METHOD, PAYMENT_STATUS, CURRENCY, DEFAULT_PAYMENT_STATUS, DEFAULT_CURRENCY

if TYPE_CHECKING:
    from app.models.booking import Booking


class Payment(BaseModel):
    __tablename__ = 'payments'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False)
    payment_method = db.Column(db.Enum(PAYMENT_METHOD), nullable=False)
    payment_status = db.Column(db.Enum(PAYMENT_STATUS), nullable=False, default=DEFAULT_PAYMENT_STATUS)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.Enum(CURRENCY), nullable=False, default=DEFAULT_CURRENCY)
    provider_payment_id = db.Column(db.String, unique=True)
    confirmation_token = db.Column(db.String)

    # Payment processing details
    is_paid = db.Column(db.Boolean, default=False, nullable=False)
    status_history = db.Column(JSONB, nullable=False, server_default='[]', default=list)
    last_webhook = db.Column(JSONB)
    meta = db.Column(JSONB)

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
            'expires_at': (self.meta or {}).get('expires_at'),
            'is_paid': self.is_paid,
            'status_history': self.status_history,
            'last_webhook': self.last_webhook,
            'metadata': self.meta,
        }

    @classmethod
    def get_by_provider_payment_id(cls, provider_payment_id: str):
        return cls.query.filter(cls.provider_payment_id == provider_payment_id).first_or_404()

    @classmethod
    def create(cls, session: Session | None = None, **kwargs):
        session = session or db.session
        status = kwargs.get('payment_status', DEFAULT_PAYMENT_STATUS)
        if isinstance(status, str):
            try:
                status_enum = PAYMENT_STATUS(status)
            except ValueError:
                status_enum = DEFAULT_PAYMENT_STATUS
        elif isinstance(status, PAYMENT_STATUS):
            status_enum = status
        else:
            status_enum = DEFAULT_PAYMENT_STATUS
        kwargs['payment_status'] = status_enum
        kwargs['status_history'] = [
            {'status': status_enum.value, 'at': datetime.now().isoformat()}
        ]
        return super().create(session, **kwargs)

    @classmethod
    def update(cls, _id, session: Session | None = None, **kwargs):
        session = session or db.session
        payment = cls.get_or_404(_id, session)
        new_status = kwargs.get('payment_status')
        if isinstance(new_status, str):
            try:
                new_status_enum = PAYMENT_STATUS(new_status)
                kwargs['payment_status'] = new_status_enum
            except ValueError:
                new_status_enum = None
        elif isinstance(new_status, PAYMENT_STATUS):
            new_status_enum = new_status
        else:
            new_status_enum = None

        if new_status_enum and new_status_enum.value != payment.payment_status.value:
            history = list(payment.status_history or [])
            history.append({
                'status': new_status_enum.value,
                'at': datetime.now().isoformat()
            })
            kwargs['status_history'] = history
        return super().update(_id, session=session, **kwargs)
