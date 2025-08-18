import uuid
from typing import Any, Dict
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from yookassa import Configuration, Payment as YooPayment

from app.config import Config
from app.database import db
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.booking_flight import BookingFlight
from app.utils.business_logic import calculate_price_details
from app.utils.enum import PAYMENT_METHOD, PAYMENT_STATUS, BOOKING_STATUS

# Configure YooKassa SDK
Configuration.account_id = Config.YOOKASSA_SHOP_ID
Configuration.secret_key = Config.YOOKASSA_SECRET_KEY


Q = Decimal('0.01')


def money(x) -> Decimal:
    return (Decimal(str(x))).quantize(Q, rounding=ROUND_HALF_UP)


def __generate_receipt(booking: Booking) -> Dict[str, Any]:
    """Form receipt object with detailed breakdown"""
    flights = booking.booking_flights.order_by(BookingFlight.id).all()
    outbound_id = flights[0].flight_id if len(flights) > 0 else None
    return_id = flights[1].flight_id if len(flights) > 1 else None

    tariffs_map = {bf.flight_id: bf.tariff_id for bf in flights}
    outbound_tariff_id = tariffs_map.get(outbound_id)
    return_tariff_id = tariffs_map.get(return_id)

    price_details = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
        booking.passenger_counts or {},
    )

    currency = price_details.get('currency', booking.currency.value).upper()

    category_map = {
        'adults': 'Взрослый',
        'children': 'Ребёнок',
        'infants': 'Младенец',
        'infants_seat': 'Младенец с местом',
    }

    items = []
    for direction in price_details.get('directions', []):
        route = direction.get('route') or {}
        origin = (route.get('origin_airport') or {}).get('iata_code', '')
        dest = (route.get('destination_airport') or {}).get('iata_code', '')
        base_desc = f'Рейс {origin}-{dest}'.strip('- ').strip()

        for passenger in direction.get('passengers', []):
            count = int(passenger.get('count', 0) or 0)
            if count <= 0:
                continue
            cat = category_map.get(passenger.get('category', ''), 'Пассажир')

            fare = money(passenger.get('fare_price', 0))
            disc = money(passenger.get('discount', 0))
            line_total = max(money(fare - disc), Decimal('0.00'))
            unit = (line_total / Decimal(count)).quantize(Q, rounding=ROUND_HALF_UP)

            items.append({
                'description': f"{base_desc}: Билет «{cat}»",
                'quantity': count,
                'amount': {'value': f"{unit:.2f}", 'currency': currency},
                # TODO: check VAT codes
                'vat_code': 1,
                'payment_mode': 'full_payment',
                'payment_subject': 'service',
            })

    for fee in price_details.get('fees', []):
        unit_amount = money(fee.get('amount', 0))
        total_amount = money(fee.get('total', 0))
        quantity = int(total_amount / unit_amount) if unit_amount > 0 else 1

        items.append({
            'description': fee.get('name'),
            'quantity': quantity,
            'amount': {'value': f"{unit_amount:.2f}", 'currency': currency},
            # TODO: check VAT codes
            'vat_code': 1,
            'payment_mode': 'full_payment',
            'payment_subject': 'service',
        })

    return {
        'customer': {'email': booking.email_address},
        'items': items,
    }


def __capture_payment(payment: Payment, session) -> YooPayment:
    """Capture authorized payment with receipt and booking number"""
    booking = payment.booking

    Booking.generate_booking_number(
        payment.booking_id, session=session, commit=False
    )

    body = {
        'amount': {
            'value': f'{payment.amount:.2f}',
            'currency': payment.currency.value.upper(),
        },
        # 'receipt': __generate_receipt(booking),
        'description': f'Booking {booking.booking_number}',
        'airline': {'booking_reference': booking.booking_number},
        'metadata': {'booking_id': str(booking.public_id), 'booking_number': booking.booking_number},
    }

    yoo_payment = YooPayment.capture(payment.provider_payment_id, body)
    return yoo_payment


def create_payment(public_id: str) -> Payment:
    """Create a two-stage payment in YooKassa and persist model"""
    booking = Booking.get_by_public_id(public_id)

    # If a pending payment already exists for this booking, return it
    existing = (
        booking.payments
        .filter(Payment.payment_status == PAYMENT_STATUS.pending)
        .order_by(Payment.created_at.desc())
        .first()
    )
    if existing:
        return existing

    amount = {
        'value': f'{booking.total_price:.2f}',
        'currency': booking.currency.value.upper(),
    }
    expires_at = datetime.now() + timedelta(hours=1)
    body = {
        'amount': amount,
        'confirmation': {'type': 'embedded'},
        'capture': False,
        'description': f'Booking {booking.public_id}',
        'receipt': __generate_receipt(booking),
        'metadata': {
            'booking_id': str(booking.public_id),
            'expires_at': expires_at.isoformat(),
        }
    }

    print(body)

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

        session.flush()
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

    print(type(is_paid), is_paid)
    print(type(captured_at), captured_at)

    if not provider_id or not status:
        return

    payment = Payment.get_by_provider_payment_id(provider_id)

    updates = {'payment_status': status, 'last_webhook': payload}
    if is_paid:
        updates['is_paid'] = is_paid
        updates['paid_at'] = captured_at

    session = db.session
    payment = Payment.update(
        payment.id, session=session, commit=False, **updates
    )

    if event == 'payment.waiting_for_capture':
        yoo_payment = YooPayment.find_one(provider_id)
        if yoo_payment.status == PAYMENT_STATUS.waiting_for_capture.value:
            __capture_payment(payment, session)

    elif event == 'payment.canceled':
        Booking.transition_status(
            id=payment.booking_id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.payment_failed,
        )

    elif event == 'payment.succeeded':
        Booking.transition_status(
            id=payment.booking_id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.payment_confirmed,
        )
        Booking.transition_status(
            id=payment.booking_id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.completed,
        )

    else:
        raise ValueError(f'Unknown event type: {event}')

    session.flush()
