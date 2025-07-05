from flask import request, jsonify

from app.models.tariff import Tariff
from app.models.flight import Flight
from app.middlewares.auth_middleware import admin_required


def get_tariffs():
    tariffs = Tariff.get_all()
    return jsonify([t.to_dict() for t in tariffs])


@admin_required
def create_tariff(current_user):
    body = request.json
    flight_id = body.get('flight_id')

    if not Flight.get_by_id(flight_id):
        return jsonify({'message': 'Flight not found'}), 404

    tariff = Tariff.create(**body)
    return jsonify(tariff.to_dict()), 201


@admin_required
def update_tariff(current_user, tariff_id):
    body = request.json
    updated = Tariff.update(tariff_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Tariff not found'}), 404


@admin_required
def delete_tariff(current_user, tariff_id):
    deleted = Tariff.delete(tariff_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Tariff not found'}), 404
