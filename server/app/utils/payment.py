from __future__ import annotations

import uuid
from typing import Any, Dict

from yookassa import Configuration, Payment as YooPayment

from app.config import Config
from app.database import db
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.booking_flight import BookingFlight
from app.utils.business_logic import calculate_price_details

# Configure YooKassa SDK
Configuration.account_id = Config.YOOKASSA_SHOP_ID or ''
Configuration.secret_key = Config.YOOKASSA_SECRET_KEY or ''


def generate_receipt(booking: Booking) -> Dict[str, Any]:
    """Form receipt object with detailed breakdown."""
    flights = booking.booking_flights.order_by(BookingFlight.id).all()
    outbound_id = flights[0].flight_id if len(flights) > 0 else None
    return_id = flights[1].flight_id if len(flights) > 1 else None

    price_details = calculate_price_details(
        outbound_id, return_id, booking.tariff_id, booking.passenger_counts or {}
    )

    currency = price_details.get('currency', booking.currency.value).upper()
    total_passengers = sum(booking.passenger_counts.values()) or 1

    items = []
    for direction in price_details.get('directions', []):
        dir_name = direction.get('direction', '')
        for passenger in direction.get('passengers', []):
            count = passenger.get('count', 0)
            if count <= 0:
                continue
            fare_price = passenger.get('fare_price', 0.0)
            unit_price = fare_price / count if count else 0.0
            items.append({
                'description': f"{dir_name.capitalize()} {passenger.get('category')} ticket",
                'quantity': count,
                'amount': {'value': f'{unit_price:.2f}', 'currency': currency},
                'vat_code': 1,
                'payment_mode': 'full_payment',
                'payment_subject': 'service',
            })

            discount = passenger.get('discount', 0.0)
            if discount > 0:
                unit_discount = discount / count if count else 0.0
                desc = f"Discount {dir_name} {passenger.get('category')}"
                discount_name = passenger.get('discount_name')
                if discount_name:
                    desc += f" ({discount_name})"
                items.append({
                    'description': desc,
                    'quantity': count,
                    'amount': {'value': f'-{unit_discount:.2f}', 'currency': currency},
                    'vat_code': 1,
                    'payment_mode': 'full_payment',
                    'payment_subject': 'service',
                })

    for fee in price_details.get('fees', []):
        items.append({
            'description': fee.get('name'),
            'quantity': total_passengers,
            'amount': {'value': f"{fee.get('amount', 0.0):.2f}", 'currency': currency},
            'vat_code': 1,
            'payment_mode': 'full_payment',
            'payment_subject': 'service',
        })

    return {
        'customer': {'email': booking.email_address},
        'items': items,
    }


def create_payment(booking: Booking) -> Payment:
    """Create a two-stage payment in YooKassa and persist model."""
    amount = {
        'value': f'{booking.total_price:.2f}',
        'currency': booking.currency.value.upper(),
    }
    body: Dict[str, Any] = {
        'amount': amount,
        'confirmation': {'type': 'embedded'},
        'capture': False,
        'description': f'Booking {booking.booking_number or booking.id}',
        'metadata': {'booking_id': booking.id},
    }
    yoo_payment: Any = YooPayment.create(body, uuid.uuid4())

    payment = Payment.create(
        db.session,
        booking_id=booking.id,
        payment_method=Config.PAYMENT_METHOD.yookassa,
        payment_status=Config.PAYMENT_STATUS.pending,
        amount=booking.total_price,
        currency=booking.currency,
        provider_payment_id=yoo_payment.id,
        confirmation_token=(yoo_payment.confirmation or {}).get('confirmation_token'),
        meta=body['metadata'],
    )

    Booking.transition_status(
        id=booking.id, session=db.session, to_status='payment_pending'
    )

    return payment


def capture_payment(payment: Payment) -> None:
    """Capture authorized payment with receipt and booking number."""
    booking = payment.booking
    receipt = generate_receipt(booking)
    body: Dict[str, Any] = {
        'amount': {
            'value': f'{payment.amount:.2f}',
            'currency': payment.currency.value.upper(),
        },
        'receipt': receipt,
        'airline': {'booking_reference': booking.booking_number},
        'metadata': {'booking_id': booking.id, 'booking_number': booking.booking_number},
    }
    YooPayment.capture(payment.provider_payment_id, body)


def handle_webhook(payload: Dict[str, Any]) -> None:
    """Process YooKassa webhook notifications."""
    event = payload.get('event')
    obj = payload.get('object') or {}
    provider_id = obj.get('id')
    status = obj.get('status')

    if not provider_id or not status:
        return

    payment = Payment.query.filter_by(provider_payment_id=provider_id).first()
    if not payment:
        return

    updates: Dict[str, Any] = {'payment_status': status, 'last_webhook': payload}
    if status == Config.PAYMENT_STATUS.succeeded.value:
        updates['is_paid'] = True
    Payment.update(payment.id, session=db.session, **updates)

    if event == 'payment.waiting_for_capture':
        Booking.generate_booking_number(payment.booking_id, session=db.session)
        api_payment = YooPayment.find_one(provider_id)
        if api_payment.status == Config.PAYMENT_STATUS.waiting_for_capture.value:
            capture_payment(payment)
    elif event == 'payment.canceled':
        Booking.transition_status(
            id=payment.booking_id, session=db.session, to_status='payment_failed'
        )
    elif event == 'payment.succeeded':
        Booking.transition_status(
            id=payment.booking_id, session=db.session, to_status='payment_confirmed'
        )

