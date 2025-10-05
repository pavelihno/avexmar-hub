import uuid
from typing import Any, Dict
from datetime import datetime, timedelta

from yookassa import Configuration, Payment as YooPayment, Invoice as YooInvoice

from app.config import Config
from app.database import db
from app.models.booking import Booking
from app.models.payment import Payment
from app.utils.business_logic import calculate_receipt_details, get_booking_details
from app.utils.datetime import format_date, format_time
from app.utils.enum import PAYMENT_METHOD, PAYMENT_STATUS, BOOKING_STATUS, PAYMENT_TYPE
from app.utils.pdf import generate_booking_pdf
from app.utils.email import EMAIL_TYPE, send_email

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


def __generate_cart(booking: Booking) -> Dict[str, Any]:
    receipt = __generate_receipt(booking)
    cart = [
        {
            'description': item['description'],
            'price': {
                'value': item['amount']['value'],
                'currency': item['amount']['currency'],
            },
            'quantity': item['quantity'],
        }
        for item in receipt.get('items', [])
    ]
    return receipt, cart


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


def __capture_invoice(payment: Payment, session) -> YooPayment:
    return __capture_payment(payment, session)


def __send_confirmation_email(booking: Booking) -> bool:
    """Send booking confirmation email to the user"""
    if not booking.email_address:
        return False

    booking_url = (
        f'{Config.CLIENT_URL}/booking/{booking.public_id}/completion'
        f'?access_token={booking.access_token}'
    )
    details = get_booking_details(booking)

    flights = []
    for f in details.get('flights', []):
        route = f.get('route') or {}
        origin = route.get('origin_airport') or {}
        dest = route.get('destination_airport') or {}
        flights.append(
            {
                'number': f.get('airline_flight_number'),
                'from': f"{origin.get('city_name')} ({origin.get('iata_code')})",
                'to': f"{dest.get('city_name')} ({dest.get('iata_code')})",
                'departure': f"{format_date(f.get('scheduled_departure'))} {format_time(f.get('scheduled_departure_time'))}",
                'arrival': f"{format_date(f.get('scheduled_arrival'))} {format_time(f.get('scheduled_arrival_time'))}",
            }
        )
    flights.sort(key=lambda x: x['departure'])

    category_labels = {
        'adult': 'Взрослый',
        'child': 'Ребёнок',
        'infant': 'Младенец',
        'infant_seat': 'Младенец с местом',
    }
    passengers = []
    for p in details.get('passengers', []):
        name = ' '.join(
            filter(None, [p.get('last_name'), p.get('first_name')])
        ).strip()
        passengers.append(
            {'name': name, 'category': category_labels.get(p.get('category'), p.get('category'))}
        )

    pdf_data = generate_booking_pdf(booking, details=details)

    send_email(
        EMAIL_TYPE.booking_confirmation,
        is_noreply=False,
        recipients=[booking.email_address],
        booking_number=str(booking.booking_number),
        booking_url=booking_url,
        flights=flights,
        passengers=passengers,
        attachments=[{
            'filename': f'booking_{booking.booking_number}.pdf',
            'content_type': 'application/pdf',
            'data': pdf_data,
        }],
    )
    return True


def __send_invoice_email(booking: Booking, payment_url: str) -> bool:
    if not booking.email_address or not payment_url:
        return False
    send_email(
        EMAIL_TYPE.invoice_payment,
        is_noreply=False,
        recipients=[booking.email_address],
        payment_url=payment_url,
        hours=Config.BOOKING_INVOICE_EXP_HOURS,
    )
    return True


def create_payment(booking: Booking) -> Payment:
    """Create a two-stage payment in YooKassa"""

    # If a pending payment already exists for this booking, return it
    existing_payment = (
        booking.payments.filter(
            Payment.payment_status == PAYMENT_STATUS.pending,
            Payment.payment_type == PAYMENT_TYPE.payment,
        )
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
            payment_type=PAYMENT_TYPE.payment,
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


def create_invoice(booking: Booking) -> Payment:
    """Create a two-stage invoice in YooKassa"""

    # If a pending invoice already exists for this booking, return it
    existing_invoice = (
        booking.payments.filter(
            Payment.payment_status == PAYMENT_STATUS.pending,
            Payment.payment_type == PAYMENT_TYPE.invoice,
        )
        .order_by(Payment.created_at.desc())
        .first()
    )
    if existing_invoice:
        return existing_invoice

    amount = {
        'value': f'{booking.total_price:.2f}',
        'currency': booking.currency.value.upper(),
    }
    receipt, cart = __generate_cart(booking)
    expires_at = datetime.now() + timedelta(hours=Config.BOOKING_INVOICE_EXP_HOURS)

    body = {
        'payment_data': {
            'amount': amount,
            'receipt': receipt,
            'capture': False,
        },
        'cart': cart,
        'expires_at': expires_at.isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
        'metadata': {
            'public_id': str(booking.public_id),
            'expires_at': expires_at.isoformat(),
        },
    }

    try:
        yoo_invoice = YooInvoice.create(body, uuid.uuid4())
        invoice_id = getattr(yoo_invoice, 'id', None)
        payment_url = getattr(yoo_invoice, 'payment_url', None)

        session = db.session
        payment = Payment.create(
            session,
            commit=False,
            booking_id=booking.id,
            payment_method=PAYMENT_METHOD.yookassa,
            payment_status=PAYMENT_STATUS.pending,
            payment_type=PAYMENT_TYPE.invoice,
            amount=booking.total_price,
            currency=booking.currency,
            provider_payment_id=invoice_id,
            expires_at=expires_at,
        )

        Booking.transition_status(
            id=booking.id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.payment_pending,
        )

        session.commit()

        __send_invoice_email(booking, payment_url)

        return payment

    except Exception as e:
        raise e


def handle_yookassa_webhook(payload: Dict[str, Any]) -> None:
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

    status_map = {'issued': PAYMENT_STATUS.pending, 'paid': PAYMENT_STATUS.succeeded}
    mapped_status = status_map.get(status, status)

    updates = {'payment_status': mapped_status, 'last_webhook': payload}
    if is_paid:
        updates['is_paid'] = is_paid
        updates['paid_at'] = captured_at

    session = db.session
    payment = Payment.update(payment.id, session=session, commit=False, **updates)
    booking = payment.booking

    send_confirmation = False

    if event in ('payment.waiting_for_capture', 'invoice.waiting_for_capture'):
        yoo_payment = YooPayment.find_one(provider_id)
        if yoo_payment.status == PAYMENT_STATUS.waiting_for_capture.value:
            if payment.payment_type == PAYMENT_TYPE.invoice:
                __capture_invoice(payment, session)
            else:
                __capture_payment(payment, session)

    elif event in ('payment.canceled', 'invoice.canceled'):
        Booking.transition_status(
            id=booking.id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.payment_failed,
        )

    elif event in ('payment.succeeded', 'invoice.paid'):
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
