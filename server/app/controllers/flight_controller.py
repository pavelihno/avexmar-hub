from flask import request, jsonify

from models.flight import Flight
from middlewares.auth_middleware import admin_required


def get_flights():
    flights = Flight.get_all()
    return jsonify([flight.to_dict() for flight in flights])


@admin_required
def create_flight(current_user):
    body = request.json
    flight = Flight.create(**body)
    return jsonify(flight.to_dict()), 201


@admin_required
def update_flight(current_user, flight_id):
    body = request.json
    updated = Flight.update(flight_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Flight not found'}), 404


@admin_required
def delete_flight(current_user, flight_id):
    deleted = Flight.delete(flight_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Flight not found'}), 404
