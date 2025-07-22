from flask import request, jsonify

from app.models.flight import Flight
from app.models.route import Route
from app.models.airline import Airline
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError, NotFoundError


@admin_required
def get_flights(current_user):
    flights = Flight.get_all()
    return jsonify([flight.to_dict() for flight in flights])


@admin_required
def get_flight(current_user, flight_id):
    try:
        flight = Flight.get_or_404(flight_id)
        return jsonify(flight.to_dict()), 200
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def create_flight(current_user):
    body = request.json
    try:
        flight = Flight.create(**body)
        return jsonify(flight.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def update_flight(current_user, flight_id):
    body = request.json
    try:
        updated = Flight.update(flight_id, **body)
        return jsonify(updated.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def delete_flight(current_user, flight_id):
    try:
        deleted = Flight.delete_or_404(flight_id)
        return jsonify(deleted.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404
