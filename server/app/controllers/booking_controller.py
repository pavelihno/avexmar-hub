from flask import request, jsonify
from app.database import db
from app.models.booking import Booking
from app.models.passenger import Passenger
from app.models.booking_passenger import BookingPassenger
from app.middlewares.auth_middleware import admin_required
from app.utils.business_logic import process_booking_create as process_booking_create_logic
from app.config import Config


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
    result.update(price)
    return jsonify(result), 201


def process_booking_passengers():
    data = request.json or {}
    public_id = data.get('public_id')
    buyer = data.get('buyer', {})
    if not public_id:
        return jsonify({'message': 'public_id_required'}), 400
    booking = Booking.get_by_public_id(public_id)
    booking.email_address = buyer.get('email')
    booking.phone_number = buyer.get('phone')
    try:
        booking.transition_status('passengers_added')
    except ValueError:
        pass
    flight_dates = [t.flight.scheduled_departure for t in booking.tickets if t.flight]
    check_date = min(flight_dates) if flight_dates else None
    errors = []
    if check_date:
        for bp in booking.booking_passengers:
            category = bp.category.value if bp.category else None
            passenger = bp.passenger
            if category == Config.PASSENGER_CATEGORY.child.value and not passenger.is_child(check_date):
                errors.append(
                    f"Passenger {passenger.last_name} {passenger.first_name} is not a child on flight date"
                )
            if category in {
                Config.PASSENGER_CATEGORY.infant.value,
                Config.PASSENGER_CATEGORY.infant_seat.value,
            } and not passenger.is_infant(check_date):
                errors.append(
                    f"Passenger {passenger.last_name} {passenger.first_name} is not an infant on flight date"
                )
    if errors:
        db.session.rollback()
        return jsonify({'errors': errors}), 400
    db.session.commit()
    return jsonify({'status': 'ok'}), 200


def get_process_booking_passengers(public_id):
    booking = Booking.get_by_public_id(public_id)
    passengers = []
    for bp in booking.booking_passengers:
        p = bp.passenger.to_dict()
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
    return jsonify({'passengers': passengers, 'passengers_exist': passengers_exist}), 200


def process_booking_payment():
    return jsonify({'status': 'ok'}), 200


def get_process_booking_details(public_id):
    booking = Booking.get_by_public_id(public_id)
    result = booking.to_dict()
    passengers = []
    for bp in booking.booking_passengers:
        p = bp.passenger.to_dict()
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

    result['passengers'] = passengers
    result['passengers_exist'] = passengers_exist
    return jsonify(result), 200


def get_process_booking_access(public_id):
    booking = Booking.get_by_public_id(public_id)
    return jsonify({'pages': booking.get_accessible_pages()}), 200

