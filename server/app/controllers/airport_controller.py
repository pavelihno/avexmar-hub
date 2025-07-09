from flask import request, jsonify

from app.models.airport import Airport
from app.middlewares.auth_middleware import admin_required


def get_airports():
    airports = Airport.get_all()
    return jsonify([airport.to_dict() for airport in airports])


@admin_required
def create_airport(current_user):
    body = request.json
    airport = Airport.create(**body)
    return jsonify(airport.to_dict()), 201


@admin_required
def update_airport(current_user, airport_id):
    body = request.json
    updated = Airport.update(airport_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Airport not found'}), 404


@admin_required
def delete_airport(current_user, airport_id):
    deleted = Airport.delete(airport_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Airport not found'}), 404
