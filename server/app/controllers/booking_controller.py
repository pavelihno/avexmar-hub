from flask import request, jsonify

from app.database import db
from app.models.booking import Booking
from app.models.booking_passenger import BookingPassenger
from app.models.booking_flight import BookingFlight
from app.models.passenger import Passenger
from app.models.payment import Payment
from app.middlewares.auth_middleware import admin_required, current_user
from app.utils.business_logic import calculate_price_details
from app.utils.payment import create_payment, handle_webhook
from app.utils.enum import BOOKING_STATUS, PASSENGER_CATEGORY


@admin_required
def get_bookings(current_user):
    bookings = Booking.get_all()
    return jsonify([booking.to_dict() for booking in bookings])


@admin_required
def get_booking(current_user, booking_id):
    booking = Booking.get_or_404(booking_id)
    return jsonify(booking.to_dict()), 200


@admin_required
def create_booking(current_user):
    session = db.session
    body = request.json
    booking = Booking.create(session, **body)
    return jsonify(booking.to_dict()), 201


@admin_required
def update_booking(current_user, booking_id):
    session = db.session
    body = request.json
    updated = Booking.update(booking_id, session=session, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_booking(current_user, booking_id):
    session = db.session
    deleted = Booking.delete_or_404(booking_id, session=session)
    return jsonify(deleted)


@current_user
def get_process_booking_access(current_user, public_id):
    return jsonify({'pages': Booking.get_accessible_pages(current_user, public_id)}), 200


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

    price = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
        passengers,
    )

    booking = Booking.create(
        session,
        currency=price['currency'],
        fare_price=price['fare_price'],
        fees=sum(f['total'] for f in price['fees']),
        total_discounts=price['total_discounts'],
        total_price=price['total_price'],
        passenger_counts=passengers,
        user_id=current_user.id if current_user else None,
    )

    if outbound_id:
        BookingFlight.create(
            session,
            booking_id=booking.id,
            flight_id=outbound_id,
            tariff_id=outbound_tariff_id,
        )
    if return_id:
        BookingFlight.create(
            session,
            booking_id=booking.id,
            flight_id=return_id,
            tariff_id=return_tariff_id,
        )

    session.refresh(booking)

    result = {'public_id': str(booking.public_id)}
    return jsonify(result), 201


@current_user
def create_booking_passengers(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    buyer = data.get('buyer', {})
    passengers = data.get('passengers') or []
    if not public_id:
        return jsonify({'message': 'public_id required'}), 400

    session = db.session

    booking = Booking.update_by_public_id(
        public_id,
        session=session,
        **buyer
    )

    existing = {bp.passenger_id: bp for bp in booking.booking_passengers}
    processed_ids = set()
    for pdata in passengers:
        pid = pdata.get('id')
        category = pdata.get('category')

        passenger_fields = {k: v for k, v in {
            'first_name': pdata.get('first_name'),
            'last_name': pdata.get('last_name'),
            'patronymic_name': pdata.get('patronymic_name'),
            'gender': pdata.get('gender'),
            'birth_date': pdata.get('birth_date'),
            'document_type': pdata.get('document_type'),
            'document_number': pdata.get('document_number'),
            'document_expiry_date': pdata.get('document_expiry_date'),
            'citizenship_id': pdata.get('citizenship_id'),
        }.items() if v is not None and v != ''}
        if pid:
            passenger = Passenger.update(pid, session=session, **passenger_fields)
        else:
            passenger = Passenger.create(session, **passenger_fields)

        processed_ids.add(passenger.id)
        bp = existing.get(passenger.id)
        if bp:
            BookingPassenger.update(bp.id, session=session, passenger_id=passenger.id, category=category)
        else:
            BookingPassenger.create(session, booking_id=booking.id, passenger_id=passenger.id, category=category)

    booking = Booking.transition_status(
        id=booking.id,
        session=session,
        to_status=BOOKING_STATUS.passengers_added.value,
    )

    return jsonify({'status': 'ok'}), 200


@current_user
def confirm_booking(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    if not public_id:
        return jsonify({'message': 'public_id required'}), 400

    session = db.session
    booking = Booking.get_by_public_id(public_id)
    Booking.transition_status(
        id=booking.id,
        session=session,
        to_status=BOOKING_STATUS.confirmed.value,
    )

    return jsonify({'status': 'ok'}), 200


@current_user
def get_process_booking_completion(current_user, public_id):
    booking = Booking.get_by_public_id(public_id)
    result = {
        'booking_number': booking.booking_number,
        'status': booking.status.value,
        'total_price': booking.total_price,
        'currency': booking.currency.value,
    }
    return jsonify(result), 200


@current_user
def get_booking_details(current_user, public_id):
    booking = Booking.get_by_public_id(public_id)
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
        key_map = {
            'adults': PASSENGER_CATEGORY.adult.value,
            'children': PASSENGER_CATEGORY.child.value,
            'infants': PASSENGER_CATEGORY.infant.value,
            'infants_seat': PASSENGER_CATEGORY.infant_seat.value,
        }
        for key, count in counts.items():
            try:
                count = int(count)
            except (TypeError, ValueError):
                continue
            category = key_map.get(key, key)
            for _ in range(count):
                passengers.append({'category': category})

    passenger_counts = dict(booking.passenger_counts or {})

    flights = [bf.flight.to_dict(return_children=True) for bf in booking.booking_flights]
    flights.sort(key=lambda f: (f.get('scheduled_departure'), f.get('scheduled_departure_time') or ''))

    outbound_id = flights[0]['id'] if len(flights) > 0 else 0
    return_id = flights[1]['id'] if len(flights) > 1 else 0

    tariffs_map = {bf.flight_id: bf.tariff_id for bf in booking.booking_flights}
    outbound_tariff_id = tariffs_map.get(outbound_id)
    return_tariff_id = tariffs_map.get(return_id)

    price_details = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
        passenger_counts,
    )

    result['passengers'] = passengers
    result['passengers_exist'] = passengers_exist
    result['flights'] = flights
    result['price_details'] = price_details

    return jsonify(result), 200


@current_user
def create_booking_payment(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    if not public_id:
        return jsonify({'message': 'public_id required'}), 400

    payment = create_payment(public_id)
    return jsonify(payment.to_dict()), 201


@current_user
def get_booking_payment(current_user, public_id):
    booking = Booking.get_by_public_id(public_id)
    payment = (
        Payment.query.filter_by(booking_id=booking.id)
        .order_by(Payment.id.desc())
        .first()
    )
    if not payment:
        return jsonify({'message': 'payment not found'}), 404
    return jsonify(payment.to_dict()), 200


def payment_webhook():
    payload = request.json or {}
    handle_webhook(payload)
    return jsonify({'status': 'ok'}), 200
