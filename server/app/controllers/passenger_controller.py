from flask import request, jsonify

from app.models.passenger import Passenger
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_passengers(current_user):
    passengers = Passenger.get_all()
    return jsonify([p.to_dict() for p in passengers])


@admin_required
def get_passenger(current_user, passenger_id):
    passenger = Passenger.get_or_404(passenger_id)
    return jsonify(passenger.to_dict())


@admin_required
def create_passenger(current_user):
    body = request.json
    passenger = Passenger.create(**body)
    return jsonify(passenger.to_dict()), 201


@admin_required
def update_passenger(current_user, passenger_id):
    body = request.json
    updated = Passenger.update(passenger_id, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_passenger(current_user, passenger_id):
    deleted = Passenger.delete_or_404(passenger_id)
    return jsonify(deleted)
