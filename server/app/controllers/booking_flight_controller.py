from flask import request, jsonify
from sqlalchemy.orm import joinedload

from app.models.booking_flight import BookingFlight
from app.models.flight_tariff import FlightTariff
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_booking_flights(current_user):
    booking_flights = (
        BookingFlight.query.options(
            joinedload(BookingFlight.booking),
            joinedload(BookingFlight.flight_tariff).joinedload(FlightTariff.flight),
            joinedload(BookingFlight.flight_tariff).joinedload(FlightTariff.tariff),
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
    payload = _normalize_payload(body)
    booking_flight = BookingFlight.create(commit=True, **payload)
    return jsonify(booking_flight.to_dict(return_children=True)), 201


@admin_required
def update_booking_flight(current_user, booking_flight_id):
    body = request.json or {}
    payload = _normalize_payload(body)
    updated = BookingFlight.update(booking_flight_id, commit=True, **payload)
    return jsonify(updated.to_dict(return_children=True)), 200


@admin_required
def delete_booking_flight(current_user, booking_flight_id):
    deleted = BookingFlight.delete_or_404(booking_flight_id, commit=True)
    return jsonify(deleted), 200


def _normalize_payload(body: dict) -> dict:
    """Ensure payload uses flight_tariff_id and drops legacy keys."""
    payload = dict(body or {})
    flight_tariff_id = payload.get('flight_tariff_id')
    flight_id = payload.get('flight_id')
    tariff_id = payload.get('tariff_id')

    if not flight_tariff_id and flight_id and tariff_id:
        flight_tariff = (
            FlightTariff.query.filter_by(flight_id=flight_id, tariff_id=tariff_id).first()
        )
        if not flight_tariff:
            raise ValueError('Invalid flight_id/tariff_id combination')
        payload['flight_tariff_id'] = flight_tariff.id

    payload.pop('flight_id', None)
    payload.pop('tariff_id', None)
    return payload
