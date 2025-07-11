from flask import request, jsonify

from app.models.booking import Booking
from app.middlewares.auth_middleware import admin_required


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
    booking = Booking.create(**body)
    return jsonify(booking.to_dict()), 201


@admin_required
def update_booking(current_user, booking_id):
    body = request.json
    updated = Booking.update(booking_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Booking not found'}), 404


@admin_required
def delete_booking(current_user, booking_id):
    deleted = Booking.delete(booking_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Booking not found'}), 404
