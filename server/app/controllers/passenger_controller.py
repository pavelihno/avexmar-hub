from flask import request, jsonify

from app.models.passenger import Passenger
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError, NotFoundError


@admin_required
def get_passengers(current_user):
    passengers = Passenger.get_all()
    return jsonify([p.to_dict() for p in passengers])


@admin_required
def get_passenger(current_user, passenger_id):
    try:
        passenger = Passenger.get_or_404(passenger_id)
        return jsonify(passenger.to_dict())
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def create_passenger(current_user):
    body = request.json
    try:
        passenger = Passenger.create(**body)
        return jsonify(passenger.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def update_passenger(current_user, passenger_id):
    body = request.json
    try:
        updated = Passenger.update(passenger_id, **body)
        return jsonify(updated.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def delete_passenger(current_user, passenger_id):
    try:
        deleted = Passenger.delete_or_404(passenger_id)
        return jsonify(deleted.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404
