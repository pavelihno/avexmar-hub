from flask import request, jsonify

from app.database import db
from datetime import datetime, timedelta

from app.models.booking import Booking
from app.models.booking_passenger import BookingPassenger
from app.models.booking_flight import BookingFlight
from app.models.passenger import Passenger
from app.models.payment import Payment
from app.models.booking_hold import BookingHold
from app.middlewares.auth_middleware import current_user
from app.utils.business_logic import calculate_price_details
from app.utils.yookassa import create_payment, create_invoice, handle_webhook
from app.utils.enum import (
    BOOKING_STATUS,
    PASSENGER_PLURAL_CATEGORY,
    CONSENT_ACTION,
    CONSENT_EVENT_TYPE,
    CONSENT_DOC_TYPE,
)
from app.utils.consent import create_booking_consent


@current_user
def get_booking_process_access(current_user, public_id):
    token = request.args.get('access_token')
    pages = Booking.get_accessible_pages(current_user, public_id, token)
    return jsonify({'pages': pages}), 200


@current_user
def create_booking_process(current_user):
    data = request.json or {}
    session = db.session

    outbound_id = int(data.get('outbound_id', 0))
    return_id = int(data.get('return_id', 0))
    outbound_tariff_id = int(data.get('outbound_tariff_id', 0))
    return_tariff_id = int(data.get('return_tariff_id', 0))
    raw_passengers = data.get('passengers', {})

    passengers = {}
    for key, value in (raw_passengers or {}).items():
        try:
            count = int(value)
        except (TypeError, ValueError):
            continue
        if count > 0:
            passengers[key] = count

    price_details = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
        passengers,
    )

    booking = Booking.create(
        session,
        commit=False,
        currency=price_details['currency'],
        fare_price=price_details['fare_price'],
        total_discounts=price_details['total_discounts'],
        fees=price_details['total_fees'],
        total_price=price_details['final_price'],
        passenger_counts=passengers,
        user_id=current_user.id if current_user else None,
    )

    if outbound_id:
        BookingFlight.create(
            session,
            commit=False,
            booking_id=booking.id,
            flight_id=outbound_id,
            tariff_id=outbound_tariff_id,
        )
    if return_id:
        BookingFlight.create(
            session,
            commit=False,
            booking_id=booking.id,
            flight_id=return_id,
            tariff_id=return_tariff_id,
        )
    expires_at = datetime.now() + timedelta(minutes=20)
    BookingHold.set_hold(
        booking.id,
        expires_at,
        session=session,
        commit=False,
    )
    session.commit()

    result = {'public_id': str(booking.public_id)}

    return jsonify(result), 201


@current_user
def create_booking_process_passengers(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    buyer = data.get('buyer', {})
    consent = bool(buyer.pop('consent', False))
    passengers = data.get('passengers') or []
    if not public_id:
        return jsonify({'message': 'public_id required'}), 400
    token = data.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)

    session = db.session

    booking = Booking.update(
        booking.id, session=session, commit=False, **buyer
    )

    existing = {bp.passenger_id: bp for bp in booking.booking_passengers}
    processed_ids = set()
    for pdata in passengers:
        pid = pdata.get('id')
        category = pdata.get('category')

        passenger_fields = {
            k: v
            for k, v in {
                'first_name': pdata.get('first_name'),
                'last_name': pdata.get('last_name'),
                'patronymic_name': pdata.get('patronymic_name'),
                'gender': pdata.get('gender'),
                'birth_date': pdata.get('birth_date'),
                'document_type': pdata.get('document_type'),
                'document_number': pdata.get('document_number'),
                'document_expiry_date': pdata.get('document_expiry_date'),
                'citizenship_id': pdata.get('citizenship_id'),
            }.items()
            if v is not None and v != ''
        }

        if pid:
            passenger = Passenger.update(
                pid,
                session=session,
                commit=False,
                **passenger_fields,
            )
        else:
            passenger = Passenger.create(
                session,
                commit=False,
                owner_user_id=current_user.id,
                **passenger_fields,
            )

        processed_ids.add(passenger.id)
        bp = existing.get(passenger.id)
        if bp:
            BookingPassenger.update(
                bp.id,
                session=session,
                commit=False,
                passenger_id=passenger.id,
                category=category,
            )
        else:
            BookingPassenger.create(
                session,
                commit=False,
                booking_id=booking.id,
                passenger_id=passenger.id,
                category=category,
            )

    Booking.transition_status(
        id=booking.id,
        session=session,
        commit=False,
        to_status=BOOKING_STATUS.passengers_added,
    )

    if consent:
        create_booking_consent(
            booking,
            CONSENT_EVENT_TYPE.pd_processing,
            CONSENT_DOC_TYPE.pd_policy,
            current_user.id if current_user else None,
            list(processed_ids),
            session=session,
        )
        create_booking_consent(
            booking,
            CONSENT_EVENT_TYPE.offer_acceptance,
            CONSENT_DOC_TYPE.offer,
            current_user.id if current_user else None,
            [],
            session=session,
        )

    session.commit()

    return jsonify({'status': 'ok'}), 200


@current_user
def confirm_booking_process(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    if not public_id:
        return jsonify({'message': 'public_id required'}), 400
    token = data.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)

    session = db.session

    Booking.transition_status(
        id=booking.id,
        session=session,
        commit=False,
        to_status=BOOKING_STATUS.confirmed,
    )

    session.commit()

    return jsonify({'status': 'ok'}), 200


@current_user
def get_booking_process_details(current_user, public_id):
    token = request.args.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)

    result = booking.to_dict()
    passengers = []
    flights = []

    for bp in booking.booking_passengers:
        p = bp.passenger.to_dict(return_children=True)
        p['category'] = bp.category.value if bp.category else None
        passengers.append(p)
    passengers_exist = len(passengers) > 0
    if not passengers:
        counts = booking.passenger_counts or {}
        for key, count in counts.items():
            try:
                count = int(count)
            except (TypeError, ValueError):
                continue
            category = BookingPassenger.get_category_from_plural(
                PASSENGER_PLURAL_CATEGORY(key)
            )
            for _ in range(count):
                passengers.append({'category': category.value})

    passenger_counts = dict(booking.passenger_counts or {})

    flights = [
        bf.flight.to_dict(return_children=True) for bf in booking.booking_flights
    ]

    flights.sort(
        key=lambda f: (
            f.get('scheduled_departure'),
            f.get('scheduled_departure_time') or '',
        )
    )

    outbound_id = flights[0]['id'] if len(flights) > 0 else 0
    return_id = flights[1]['id'] if len(flights) > 1 else 0

    tariffs_map = {bf.flight_id: bf.tariff_id for bf in booking.booking_flights}
    outbound_tariff_id = tariffs_map.get(outbound_id)
    return_tariff_id = tariffs_map.get(return_id)

    consent_exists = (
        booking.consent_events.filter_by(
            type=CONSENT_EVENT_TYPE.pd_processing, action=CONSENT_ACTION.agree
        ).count()
        > 0
    )

    result['passengers'] = passengers
    result['passengers_exist'] = passengers_exist
    result['flights'] = flights
    result['price_details'] = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
        passenger_counts,
    )
    result['consent'] = consent_exists

    return jsonify(result), 200


@current_user
def create_booking_process_payment(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    if not public_id:
        return jsonify({'message': 'public_id required'}), 400
    token = data.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)
    session = db.session
    BookingHold.set_hold(
        booking.id,
        datetime.now() + timedelta(minutes=60),
        session=session,
        commit=False,
    )
    payment = create_payment(booking)
    return jsonify(payment.to_dict()), 201


@current_user
def create_booking_process_invoice(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    if not public_id:
        return jsonify({'message': 'public_id required'}), 400
    token = data.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)
    session = db.session
    BookingHold.set_hold(
        booking.id,
        datetime.now() + timedelta(days=1),
        session=session,
        commit=False,
    )
    payment = create_invoice(booking)
    return jsonify(payment.to_dict()), 201


@current_user
def get_booking_process_payment(current_user, public_id):
    token = request.args.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)

    payment = (
        Payment.query.filter_by(booking_id=booking.id)
        .order_by(Payment.id.desc())
        .first_or_404()
    )
    return jsonify(payment.to_dict()), 200


def yookassa_webhook():
    payload = request.json or {}
    handle_webhook(payload)
    return jsonify({'status': 'ok'}), 200
