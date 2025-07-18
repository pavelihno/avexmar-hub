from flask import request, jsonify

from app.models.booking import Booking
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError


@admin_required
def get_bookings(current_user):
    bookings = Booking.get_all()
    return jsonify([booking.to_dict() for booking in bookings])


@admin_required
def get_booking(current_user, booking_id):
    booking = Booking.get_by_id(booking_id)
    if booking:
        return jsonify(booking.to_dict()), 200
    return jsonify({'message': 'Booking not found'}), 404


@admin_required
def create_booking(current_user):
    body = request.json
    try:
        booking = Booking.create(**body)
        return jsonify(booking.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_booking(current_user, booking_id):
    body = request.json
    try:
        updated = Booking.update(booking_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Booking not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_booking(current_user, booking_id):
    try:
        deleted = Booking.delete(booking_id)
        if deleted:
            return jsonify(deleted.to_dict())
        return jsonify({'message': 'Booking not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
