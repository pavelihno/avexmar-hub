from flask import request, jsonify

from app.models.booking_flight_passenger import BookingFlightPassenger
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_booking_flight_passengers(current_user):
    booking_flight_passengers = BookingFlightPassenger.get_all()
    return jsonify([bfp.to_dict(return_children=True) for bfp in booking_flight_passengers]), 200


@admin_required
def get_booking_flight_passenger(current_user, booking_flight_passenger_id):
    booking_flight_passenger = BookingFlightPassenger.get_or_404(
        booking_flight_passenger_id
    )
    return jsonify(booking_flight_passenger.to_dict(return_children=True)), 200


@admin_required
def create_booking_flight_passenger(current_user):
    body = request.json
    booking_flight_passenger = BookingFlightPassenger.create(
        commit=True, **body
    )
    return jsonify(booking_flight_passenger.to_dict(return_children=True)), 201


@admin_required
def update_booking_flight_passenger(current_user, booking_flight_passenger_id):
    body = request.json
    updated = BookingFlightPassenger.update(
        booking_flight_passenger_id, commit=True, **body
    )
    return jsonify(updated.to_dict(return_children=True)), 200


@admin_required
def delete_booking_flight_passenger(current_user, booking_flight_passenger_id):
    deleted = BookingFlightPassenger.delete_or_404(
        booking_flight_passenger_id, commit=True
    )
    return jsonify(deleted), 200
