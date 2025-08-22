import uuid
from typing import Any, Dict
from datetime import datetime, timedelta

from yookassa import Configuration, Payment as YooPayment

from app.config import Config
from app.database import db
from app.models.booking import Booking
from app.models.payment import Payment
from app.utils.business_logic import calculate_receipt_details
from app.utils.datetime import format_date
from app.utils.enum import PAYMENT_METHOD, PAYMENT_STATUS, BOOKING_STATUS
from app.utils.email import send_email

# Configure YooKassa SDK
Configuration.account_id = Config.YOOKASSA_SHOP_ID
Configuration.secret_key = Config.YOOKASSA_SECRET_KEY


def __generate_receipt(booking: Booking) -> Dict[str, Any]:
    """Form receipt object with detailed breakdown"""
    details = calculate_receipt_details(booking)
    currency = details.get('currency', booking.currency.value).upper()
    seat_class_map = {'economy': 'Эконом', 'business': 'Бизнес'}
    items = []
    for direction in details.get('directions', []):
        route = direction.get('route') or {}
        origin = (route.get('origin_airport') or {}).get('city_name', '')
        dest = (route.get('destination_airport') or {}).get('city_name', '')
        seat_class = seat_class_map.get(
            direction.get('seat_class', ''), direction.get('seat_class', '')
        )
        date = direction.get('date')
        date_str = format_date(date, '%d.%m.%y')

        for passenger in direction.get('passengers', []):
            price = passenger.get('price', 0.0)
            full_name = passenger.get('full_name', '')
            description = (
                f'Организация авиаперевозки пассажиров и багажа по маршруту '
                f'{origin} — {dest}. {seat_class} класс. {date_str}. {full_name}'
            )
            items.append(
                {
                    'description': description,
                    'quantity': '1',
                    'amount': {'value': f'{price:.2f}', 'currency': currency},
                    'vat_code': 7,
                    'payment_mode': 'full_payment',
                    'payment_subject': 'service',
                }
            )

    return {
        'customer': {'email': booking.email_address},
        'items': items,
    }


def __capture_payment(payment: Payment, session) -> YooPayment:
    """Capture authorized payment with receipt and booking number"""
    booking = payment.booking

    Booking.generate_booking_number(booking.id, session=session, commit=False)

    body = {
        'amount': {
            'value': f'{payment.amount:.2f}',
            'currency': payment.currency.value.upper(),
        },
    }

    yoo_payment = YooPayment.capture(payment.provider_payment_id, body)
    return yoo_payment


def __send_confirmation_email(booking: Booking) -> bool:
    """Send booking confirmation email to the user"""
    if not booking.email_address:
        return False

    booking_url = (
        f'{Config.CLIENT_URL}/booking/{booking.public_id}/completion'
        f'?access_token={booking.access_token}'
    )
    send_email(
        subject=f'Подтверждение бронирования № {str(booking.booking_number)}',
        recipients=[booking.email_address],
        template='booking_confirmation.txt',
        booking_number=str(booking.booking_number),
        total_price=f'{booking.total_price:.2f}',
        currency=booking.currency.value.upper(),
        booking_url=booking_url,
    )
    return True


def create_payment(booking: Booking) -> Payment:
    """Create a two-stage payment in YooKassa and persist model"""

    # If a pending payment already exists for this booking, return it
    existing_payment = (
        booking.payments.filter(Payment.payment_status == PAYMENT_STATUS.pending)
        .order_by(Payment.created_at.desc())
        .first()
    )
    if existing_payment:
        return existing_payment

    amount = {
        'value': f'{booking.total_price:.2f}',
        'currency': booking.currency.value.upper(),
    }
    expires_at = datetime.now() + timedelta(hours=Config.BOOKING_PAYMENT_EXP_HOURS)
    body = {
        'amount': amount,
        'confirmation': {'type': 'embedded'},
        'capture': False,
        'receipt': __generate_receipt(booking),
        'metadata': {
            'public_id': str(booking.public_id),
            'expires_at': expires_at.isoformat(),
        },
    }

    try:
        yoo_payment = YooPayment.create(body, uuid.uuid4())
        yookassa_payment_id = getattr(yoo_payment, 'id', None)
        confirmation_token = getattr(
            getattr(yoo_payment, 'confirmation', None), 'confirmation_token', None
        )

        session = db.session
        payment = Payment.create(
            session,
            commit=False,
            booking_id=booking.id,
            payment_method=PAYMENT_METHOD.yookassa,
            payment_status=PAYMENT_STATUS.pending,
            amount=booking.total_price,
            currency=booking.currency,
            provider_payment_id=yookassa_payment_id,
            confirmation_token=confirmation_token,
            expires_at=expires_at,
        )

        Booking.transition_status(
            id=booking.id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.payment_pending,
        )

        session.commit()

        return payment

    except Exception as e:
        raise e


def handle_webhook(payload: Dict[str, Any]) -> None:
    """Process YooKassa webhook notifications"""
    event = payload.get('event')

    obj = payload.get('object') or {}
    provider_id = obj.get('id')
    status = obj.get('status')
    is_paid = obj.get('paid', False)
    captured_at = obj.get('captured_at')

    if not provider_id or not status:
        return

    payment = Payment.get_by_provider_payment_id(provider_id)

    updates = {'payment_status': status, 'last_webhook': payload}
    if is_paid:
        updates['is_paid'] = is_paid
        updates['paid_at'] = captured_at

    session = db.session
    payment = Payment.update(payment.id, session=session, commit=False, **updates)
    booking = payment.booking

    send_confirmation = False

    if event == 'payment.waiting_for_capture':
        yoo_payment = YooPayment.find_one(provider_id)
        if yoo_payment.status == PAYMENT_STATUS.waiting_for_capture.value:
            __capture_payment(payment, session)

    elif event == 'payment.canceled':
        Booking.transition_status(
            id=booking.id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.payment_failed,
        )

    elif event == 'payment.succeeded':
        Booking.transition_status(
            id=booking.id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.payment_confirmed,
        )
        Booking.transition_status(
            id=booking.id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.completed,
        )
        booking = payment.booking
        if not booking.access_token:
            Booking.update(
                booking.id,
                session=session,
                commit=False,
                access_token=uuid.uuid4(),
            )
        send_confirmation = True

    else:
        raise ValueError(f'Unknown event type: {event}')

    session.commit()

    if send_confirmation:
        __send_confirmation_email(booking)

    return
