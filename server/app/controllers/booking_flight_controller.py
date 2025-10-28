from flask import request, jsonify
from sqlalchemy.orm import joinedload

from app.models.booking_flight import BookingFlight
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_booking_flights(current_user):
    booking_flights = (
        BookingFlight.query.options(
            joinedload(BookingFlight.booking),
            joinedload(BookingFlight.flight),
            joinedload(BookingFlight.tariff),
        ).all()
    )
    return jsonify([bf.to_dict(return_children=True) for bf in booking_flights]), 200


@admin_required
def get_booking_flight(current_user, booking_flight_id):
    booking_flight = BookingFlight.get_or_404(booking_flight_id)
    return jsonify(booking_flight.to_dict(return_children=True)), 200


@admin_required
def create_booking_flight(current_user):
    body = request.json or {}
    booking_flight = BookingFlight.create(commit=True, **body)
    return jsonify(booking_flight.to_dict(return_children=True)), 201


@admin_required
def update_booking_flight(current_user, booking_flight_id):
    body = request.json or {}
    updated = BookingFlight.update(booking_flight_id, commit=True, **body)
    return jsonify(updated.to_dict(return_children=True)), 200


@admin_required
def delete_booking_flight(current_user, booking_flight_id):
    deleted = BookingFlight.delete_or_404(booking_flight_id, commit=True)
    return jsonify(deleted), 200
