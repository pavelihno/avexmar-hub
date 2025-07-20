from flask import request, jsonify

from app.models.tariff import Tariff
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError


@admin_required
def get_tariffs(current_user):
    tariffs = Tariff.get_all()
    return jsonify([t.to_dict() for t in tariffs])


@admin_required
def get_tariff(current_user, tariff_id):
    tariff = Tariff.get_by_id(tariff_id)
    if tariff:
        return jsonify(tariff.to_dict()), 200
    return jsonify({'message': 'Tariff not found'}), 404


@admin_required
def create_tariff(current_user):
    body = request.json

    try:
        tariff = Tariff.create(**body)
        return jsonify(tariff.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_tariff(current_user, tariff_id):
    body = request.json
    try:
        updated = Tariff.update(tariff_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Tariff not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_tariff(current_user, tariff_id):
    try:
        deleted = Tariff.delete(tariff_id)
        if deleted:
            return jsonify(deleted.to_dict())
        return jsonify({'message': 'Tariff not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
