from flask import request, jsonify

from app.models.booking import Booking
from app.middlewares.auth_middleware import admin_required
from app.utils.business_logic import process_booking_create as process_booking_create_logic


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
    booking = process_booking_create_logic(data)
    return jsonify({'public_id': str(booking.public_id)}), 201


def process_booking_passengers():
    return jsonify({'status': 'ok'}), 200


def process_booking_payment():
    return jsonify({'status': 'ok'}), 200

