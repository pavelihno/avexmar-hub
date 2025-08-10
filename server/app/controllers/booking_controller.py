from flask import request, jsonify
from sqlalchemy.exc import DataError

from app.database import db
from app.models.booking import Booking
from app.models.passenger import Passenger
from app.models.booking_passenger import BookingPassenger
from app.middlewares.auth_middleware import admin_required
from app.utils.business_logic import process_booking_create as process_booking_create_logic
from app.config import Config
from app.utils.datetime import parse_date


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
    body = request.json
    booking = Booking.create(**body)
    return jsonify(booking.to_dict()), 201


@admin_required
def update_booking(current_user, booking_id):
    body = request.json
    updated = Booking.update(booking_id, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_booking(current_user, booking_id):
    deleted = Booking.delete_or_404(booking_id)
    return jsonify(deleted)


def process_booking_create():
    data = request.json or {}
    booking, price = process_booking_create_logic(data)
    result = {'public_id': str(booking.public_id)}
    return jsonify(result), 201


def process_booking_passengers():
    data = request.json or {}
    public_id = data.get('public_id')
    buyer = data.get('buyer', {})
    passengers = data.get('passengers') or []
    if not public_id:
        return jsonify({'message': 'public_id_required'}), 400

    booking = Booking.get_by_public_id(public_id)
    booking.email_address = buyer.get('email')
    booking.phone_number = buyer.get('phone')

    # Process passengers: create or update, keep track of processed ids
    session = db.session
    existing = {bp.passenger_id: bp for bp in booking.booking_passengers}
    processed_ids = set()
    for pdata in passengers:
        pid = pdata.get('id')
        gender = pdata.get('gender')
        doc_type = pdata.get('document_type')

        passenger_fields = {
            'first_name': pdata.get('first_name'),
            'last_name': pdata.get('last_name'),
            'patronymic_name': pdata.get('patronymic_name'),
            'gender': Config.GENDER[gender].value if gender and Config.GENDER[gender] else None,
            'birth_date': pdata.get('birth_date'),
            'document_type': Config.DOCUMENT_TYPE[doc_type].value if doc_type and Config.DOCUMENT_TYPE[doc_type] else None,
            'document_number': pdata.get('document_number'),
            'document_expiry_date': parse_date(pdata.get('document_expiry_date')),
            'citizenship_id': pdata.get('citizenship_id'),
        }
        if pid:
            passenger = Passenger.update(pid, **passenger_fields)
        else:
            passenger = Passenger.create(**passenger_fields)

        processed_ids.add(passenger.id)
        category = pdata.get('category')
        category_enum = Config.PASSENGER_CATEGORY[category] if category else None
        bp = existing.get(passenger.id)
        if bp:
            BookingPassenger.update(bp.id, passenger_id=passenger.id, category=category_enum)
        else:
            BookingPassenger.create(booking_id=booking.id, passenger_id=passenger.id, category=category_enum)

    # Remove passengers that are no longer present
    for bp in list(booking.booking_passengers):
        if bp.passenger_id not in processed_ids:
            session.delete(bp)
            if bp.passenger.booking_passengers.count() <= 1 and bp.passenger.tickets.count() == 0:
                session.delete(bp.passenger)

    session.flush()
    session.commit()
    try:
        booking.transition_status('passengers_added')
    except ValueError:
        pass
    except DataError:
        session.rollback()

    return jsonify({'status': 'ok'}), 200


def process_booking_payment():
    return jsonify({'status': 'ok'}), 200


def get_process_booking_details(public_id):
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
            'adults': Config.PASSENGER_CATEGORY.adult.value,
            'children': Config.PASSENGER_CATEGORY.child.value,
            'infants': Config.PASSENGER_CATEGORY.infant.value,
            'infants_seat': Config.PASSENGER_CATEGORY.infant_seat.value,
        }
        for key, count in counts.items():
            try:
                count = int(count)
            except (TypeError, ValueError):
                continue
            category = key_map.get(key, key)
            for _ in range(count):
                passengers.append({'category': category})

    for bf in booking.booking_flights:
        flights.append(bf.flight.to_dict(return_children=True))

    result['passengers'] = passengers
    result['passengers_exist'] = passengers_exist
    result['flights'] = flights
    return jsonify(result), 200


def get_process_booking_access(public_id):
    booking = Booking.get_by_public_id(public_id)
    return jsonify({'pages': booking.get_accessible_pages()}), 200

