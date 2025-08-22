from flask import request, jsonify

from app.models.aircraft import Aircraft
from app.middlewares.auth_middleware import admin_required


def get_aircrafts():
    aircrafts = Aircraft.get_all()
    return jsonify([aircraft.to_dict() for aircraft in aircrafts])


def get_aircraft(aircraft_id):
    aircraft = Aircraft.get_or_404(aircraft_id)
    return jsonify(aircraft.to_dict())


@admin_required
def create_aircraft(current_user):
    data = request.get_json()
    aircraft = Aircraft.create(**data)
    return jsonify(aircraft.to_dict()), 201


@admin_required
def update_aircraft(current_user, aircraft_id):
    data = request.get_json()
    aircraft = Aircraft.update(aircraft_id, **data)
    return jsonify(aircraft.to_dict())


@admin_required
def delete_aircraft(current_user, aircraft_id):
    aircraft = Aircraft.delete(aircraft_id, commit=True)
    return jsonify(aircraft)
