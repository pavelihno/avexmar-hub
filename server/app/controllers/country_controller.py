from flask import request, jsonify

from app.models.country import Country
from app.middlewares.auth_middleware import admin_required

@admin_required
def get_countries(current_user):
    countries = Country.get_all()
    return jsonify([c.to_dict() for c in countries])

@admin_required
def get_country(current_user, country_id):
    country = Country.get_by_id(country_id)
    if country:
        return jsonify(country.to_dict()), 200
    return jsonify({'message': 'Country not found'}), 404

@admin_required
def create_country(current_user):
    body = request.json
    country = Country.create(**body)
    return jsonify(country.to_dict()), 201

@admin_required
def update_country(current_user, country_id):
    body = request.json
    updated = Country.update(country_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Country not found'}), 404

@admin_required
def delete_country(current_user, country_id):
    deleted = Country.delete(country_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Country not found'}), 404
