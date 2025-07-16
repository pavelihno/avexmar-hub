from flask import request, jsonify

from app.models.flight import Flight
from app.models.route import Route
from app.models.airline import Airline
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError


@admin_required
def get_flights(current_user):
    flights = Flight.get_all()
    return jsonify([flight.to_dict() for flight in flights])


@admin_required
def get_flight(current_user, flight_id):
    flight = Flight.get_by_id(flight_id)
    if flight:
        return jsonify(flight.to_dict()), 200
    return jsonify({'message': 'Flight not found'}), 404


@admin_required
def create_flight(current_user):
    body = request.json
    route_id = body.get('route_id')
    airline_id = body.get('airline_id')

    if not Route.get_by_id(route_id):
        return jsonify({'message': 'Route not found'}), 404
    if not Airline.get_by_id(airline_id):
        return jsonify({'message': 'Airline not found'}), 404
    try:
        flight = Flight.create(**body)
        return jsonify(flight.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_flight(current_user, flight_id):
    body = request.json
    route_id = body.get('route_id')
    airline_id = body.get('airline_id')

    if route_id is not None and not Route.get_by_id(route_id):
        return jsonify({'message': 'Route not found'}), 404
    if airline_id is not None and not Airline.get_by_id(airline_id):
        return jsonify({'message': 'Airline not found'}), 404

    try:
        updated = Flight.update(flight_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Flight not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_flight(current_user, flight_id):
    deleted = Flight.delete(flight_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Flight not found'}), 404
