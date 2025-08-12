from __future__ import annotations

import uuid
from typing import Any, Dict

from yookassa import Configuration, Payment as YooPayment

from app.config import Config
from app.database import db
from app.models.booking import Booking
from app.models.payment import Payment

# Configure YooKassa SDK
Configuration.account_id = Config.YOOKASSA_SHOP_ID or ''
Configuration.secret_key = Config.YOOKASSA_SECRET_KEY or ''


def create_payment(booking: Booking, return_url: str) -> Payment:
    """Create a payment in YooKassa and persist Payment model."""
    amount = {
        'value': str(booking.total_price),
        'currency': booking.currency.value,
    }
    yoo_payment: Any = YooPayment.create(
        {
            'amount': amount,
            'confirmation': {'type': 'embedded', 'return_url': return_url},
            'capture': True,
            'description': f'Booking {booking.booking_number}',
        },
        uuid.uuid4(),
    )

    payment = Payment.create(
        db.session,
        booking_id=booking.id,
        payment_method=Config.PAYMENT_METHOD.card,
        payment_status=Config.PAYMENT_STATUS.pending,
        amount=booking.total_price,
        currency=booking.currency,
        provider_payment_id=yoo_payment.id,
        confirmation_token=(yoo_payment.confirmation or {}).get('confirmation_token'),
    )

    Booking.transition_status(
        id=booking.id, session=db.session, to_status='payment_pending'
    )

    return payment


def handle_webhook(payload: Dict[str, Any]) -> None:
    """Process YooKassa webhook notifications."""
    obj = payload.get('object') or {}
    provider_id = obj.get('id')
    status = obj.get('status')

    if not provider_id or not status:
        return

    payment = Payment.query.filter_by(provider_payment_id=provider_id).first()
    if not payment:
        return

    try:
        payment.payment_status = Config.PAYMENT_STATUS(status)
    except ValueError:
        pass

    db.session.add(payment)

    if status == Config.PAYMENT_STATUS.succeeded.value:
        Booking.transition_status(
            id=payment.booking_id, session=db.session, to_status='payment_confirmed'
        )
    elif status == Config.PAYMENT_STATUS.canceled.value:
        Booking.transition_status(
            id=payment.booking_id, session=db.session, to_status='payment_failed'
        )

    db.session.commit()
