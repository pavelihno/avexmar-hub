from flask import request, jsonify

from app.models.flight import Flight
from app.models.route import Route
from app.middlewares.auth_middleware import admin_required


def get_flights():
    flights = Flight.get_all()
    return jsonify([flight.to_dict() for flight in flights])


@admin_required
def create_flight(current_user):
    body = request.json
    route_id = body.get('route_id')

    if not Route.get_by_id(route_id):
        return jsonify({'message': 'Route not found'}), 404

    flight = Flight.create(**body)
    return jsonify(flight.to_dict()), 201


@admin_required
def update_flight(current_user, flight_id):
    body = request.json
    route_id = body.get('route_id')

    if route_id is not None and not Route.get_by_id(route_id):
        return jsonify({'message': 'Route not found'}), 404

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
