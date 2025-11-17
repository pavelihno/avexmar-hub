import uuid
from typing import Any, Dict
from datetime import datetime, timedelta

from yookassa import Configuration, Payment as YooPayment, Invoice as YooInvoice, Refund as YooRefund

from app.config import Config
from app.constants.branding import SEAT_CLASS_LABELS, CURRENCY_LABELS
from app.utils.passenger_categories import PASSENGER_CATEGORY_LABELS
from app.constants.files import BOOKING_PDF_FILENAME_TEMPLATE
from app.constants.yookassa import YooKassaMessages, YOOKASSA_RECEIPT_DESCRIPTION_TEMPLATE
from app.database import db
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.ticket import Ticket
from app.utils.business_logic import calculate_receipt_details, calculate_refund_details, get_booking_snapshot
from app.utils.datetime import format_date, format_time, parse_datetime
from app.utils.enum import (
    PAYMENT_METHOD,
    PAYMENT_STATUS,
    BOOKING_STATUS,
    PAYMENT_TYPE,
)
from app.utils.pdf import generate_booking_pdf
from app.utils.email import EMAIL_TYPE, send_email

# Configure YooKassa SDK
Configuration.account_id = Config.YOOKASSA_SHOP_ID
Configuration.secret_key = Config.YOOKASSA_SECRET_KEY


def __generate_receipt(booking: Booking) -> Dict[str, Any]:
    """Form receipt object with detailed breakdown"""
    details = calculate_receipt_details(booking)
    currency = details.get('currency', booking.currency.value).upper()
    items = []
    for direction in details.get('directions', []):
        route = direction.get('route') or {}
        origin = (route.get('origin_airport') or {}).get('city_name', '')
        dest = (route.get('destination_airport') or {}).get('city_name', '')
        seat_class = SEAT_CLASS_LABELS.get(
            direction.get('seat_class', ''),
            direction.get('seat_class', '')
        )
        date = direction.get('date')
        date_str = format_date(date, '%d.%m.%y')

        for passenger in direction.get('passengers', []):
            price = passenger.get('price', 0.0)
            full_name = passenger.get('full_name', '')
            description = YOOKASSA_RECEIPT_DESCRIPTION_TEMPLATE.format(
                origin=origin,
                destination=dest,
                seat_class=seat_class,
                date=date_str,
                passenger=full_name,
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


def __generate_refund_receipt(booking: Booking, refund_details: dict) -> Dict[str, Any]:
    refund_amount = refund_details.get('refund_amount')
    amount = {
        'value': f'{refund_amount:.2f}',
        'currency': refund_details.get('currency', '').upper(),
    }

    passenger = refund_details.get('passenger', {})
    flight = refund_details.get('flight', {})

    full_name = passenger.get('full_name', '')
    seat_class = SEAT_CLASS_LABELS.get(
        flight.get('seat_class', ''),
        flight.get('seat_class', '')
    )
    origin = flight.get('origin')
    dest = flight.get('destination')
    date = flight.get('departure_date')
    date_str = format_date(date, '%d.%m.%y')

    description = YOOKASSA_RECEIPT_DESCRIPTION_TEMPLATE.format(
        origin=origin,
        destination=dest,
        seat_class=seat_class,
        date=date_str,
        passenger=full_name,
    )

    items = [
        {
            'description': description,
            'quantity': '1',
            'amount': amount,
            'vat_code': 7,
            'payment_mode': 'full_payment',
            'payment_subject': 'service',
        }
    ]

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
    details = get_booking_snapshot(booking)

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

    passengers = []
    for p in details.get('passengers', []):
        name = ' '.join(
            filter(None, [p.get('last_name'), p.get('first_name')])
        ).strip()
        passengers.append(
            {
                'name': name,
                'category': PASSENGER_CATEGORY_LABELS.get(
                    p.get('category'), p.get('category')
                ),
            }
        )

    pdf_data = generate_booking_pdf(booking)

    send_email(
        EMAIL_TYPE.booking_confirmation,
        is_noreply=False,
        recipients=[booking.email_address],
        booking_number=str(booking.booking_number),
        booking_url=booking_url,
        flights=flights,
        passengers=passengers,
        attachments=[{
            'filename': BOOKING_PDF_FILENAME_TEMPLATE.format(
                booking_number=booking.booking_number
            ),
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


def __send_refund_email(booking: Booking, refund_details: dict) -> bool:
    recipient = booking.email_address
    if not recipient:
        return False

    refund_amount = (refund_details or {}).get('refund_amount')
    currency_code = (refund_details or {}).get('currency')
    currency_label = CURRENCY_LABELS.get(
        currency_code,
        (currency_code or '').upper(),
    )

    passenger = refund_details.get('passenger', {})
    passenger_name = passenger.get('full_name', '')

    ticket = refund_details.get('ticket', {})
    ticket_number = ticket.get('ticket_number', '')

    send_email(
        EMAIL_TYPE.ticket_refund,
        recipients=[recipient],
        booking_number=booking.booking_number,
        ticket_number=ticket_number,
        refund_amount=f"{refund_amount:.2f}",
        currency_label=currency_label,
        passenger_name=passenger_name,
    )


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
            getattr(yoo_payment, 'confirmation', None),
            'confirmation_token', None
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


def refund_payment(booking: Booking, ticket: Ticket):
    last_successful_payment = (
        booking.payments.filter(
            Payment.payment_status == PAYMENT_STATUS.succeeded,
            Payment.payment_type.in_(
                [PAYMENT_TYPE.payment, PAYMENT_TYPE.invoice]),
        )
        .order_by(Payment.id.desc())
        .first_or_404()
    )

    _, _, _, refund_details = calculate_refund_details(
        booking,
        ticket,
    )

    refund_amount = refund_details.get('refund_amount')
    amount = {
        'value': f'{refund_amount:.2f}',
        'currency': refund_details.get('currency', '').upper(),
    }

    body = {
        'amount': amount,
        'payment_id': last_successful_payment.provider_payment_id,
        'receipt': __generate_refund_receipt(booking, refund_details),
        'metadata': {
            'public_id': str(booking.public_id),
        },
    }

    try:
        yoo_refund = YooRefund.create(body, uuid.uuid4())
        yookassa_refund_id = getattr(yoo_refund, 'id', None)

        session = db.session
        payment = Payment.create(
            session,
            commit=False,
            booking_id=booking.id,
            payment_method=PAYMENT_METHOD.yookassa,
            payment_status=PAYMENT_STATUS.pending,
            payment_type=PAYMENT_TYPE.refund,
            amount=refund_amount,
            currency=booking.currency,
            provider_payment_id=yookassa_refund_id,
            expires_at=datetime.now(),
        )

        session.commit()

        __send_refund_email(
            booking,
            refund_details
        )

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

    status_map = {
        'issued': PAYMENT_STATUS.pending,
        'paid': PAYMENT_STATUS.succeeded
    }
    mapped_status = status_map.get(status, status)

    updates = {'payment_status': mapped_status, 'last_webhook': payload}
    if is_paid:
        updates['is_paid'] = is_paid
        updates['paid_at'] = parse_datetime(captured_at)

    session = db.session
    payment = Payment.update(
        payment.id, session=session, commit=False, **updates
    )
    booking = payment.booking

    payment_succeeded = False

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
        Booking.create_booking_flight_passengers(
            booking_id=booking.id,
            session=session,
            commit=False,
        )
        Booking.save_details_snapshot(
            id=booking.id,
            session=session,
            commit=True,
        )
        payment_succeeded = True

    else:
        raise ValueError(YooKassaMessages.unknown_event_type(event))

    if payment_succeeded:
        __send_confirmation_email(booking)

    return
