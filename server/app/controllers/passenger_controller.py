from flask import request, jsonify

from app.models.passenger import Passenger
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError


@admin_required
def get_passengers(current_user):
    passengers = Passenger.get_all()
    return jsonify([p.to_dict() for p in passengers])


@admin_required
def get_passenger(current_user, passenger_id):
    passenger = Passenger.get_by_id(passenger_id)
    if passenger:
        return jsonify(passenger.to_dict())
    return jsonify({'message': 'Passenger not found'}), 404


@admin_required
def create_passenger(current_user):
    body = request.json
    try:
        passenger = Passenger.create(**body)
        return jsonify(passenger.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_passenger(current_user, passenger_id):
    body = request.json
    try:
        updated = Passenger.update(passenger_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Passenger not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_passenger(current_user, passenger_id):
    deleted = Passenger.delete(passenger_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Passenger not found'}), 404
