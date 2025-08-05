from flask import request, jsonify

from app.models.booking_passenger import BookingPassenger
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_booking_passengers(current_user):
    booking_passengers = BookingPassenger.get_all()
    return jsonify([bp.to_dict() for bp in booking_passengers])


@admin_required
def get_booking_passenger(current_user, booking_passenger_id):
    booking_passenger = BookingPassenger.get_or_404(booking_passenger_id)
    return jsonify(booking_passenger.to_dict()), 200


@admin_required
def create_booking_passenger(current_user):
    body = request.json
    booking_passenger = BookingPassenger.create(**body)
    return jsonify(booking_passenger.to_dict()), 201


@admin_required
def update_booking_passenger(current_user, booking_passenger_id):
    body = request.json
    updated = BookingPassenger.update(booking_passenger_id, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_booking_passenger(current_user, booking_passenger_id):
    deleted = BookingPassenger.delete_or_404(booking_passenger_id)
    return jsonify(deleted)
