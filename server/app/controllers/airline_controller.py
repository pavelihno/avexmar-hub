from flask import request, jsonify

from app.models.airline import Airline
from app.models.country import Country
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_airlines(current_user):
    airlines = Airline.get_all()
    return jsonify([a.to_dict() for a in airlines])


@admin_required
def get_airline(current_user, airline_id):
    airline = Airline.get_by_id(airline_id)
    if airline:
        return jsonify(airline.to_dict()), 200
    return jsonify({'message': 'Airline not found'}), 404


@admin_required
def create_airline(current_user):
    body = request.json
    country_id = body.get('country_id')
    if country_id is not None and not Country.get_by_id(country_id):
        return jsonify({'message': 'Country not found'}), 404
    airline = Airline.create(**body)
    return jsonify(airline.to_dict()), 201


@admin_required
def update_airline(current_user, airline_id):
    body = request.json
    country_id = body.get('country_id')
    if country_id is not None and not Country.get_by_id(country_id):
        return jsonify({'message': 'Country not found'}), 404
    updated = Airline.update(airline_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Airline not found'}), 404


@admin_required
def delete_airline(current_user, airline_id):
    deleted = Airline.delete(airline_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Airline not found'}), 404
