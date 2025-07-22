from flask import request, jsonify

from app.models.tariff import Tariff
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError, NotFoundError


@admin_required
def get_tariffs(current_user):
    tariffs = Tariff.get_all()
    return jsonify([t.to_dict() for t in tariffs])


@admin_required
def get_tariff(current_user, tariff_id):
    try:
        tariff = Tariff.get_or_404(tariff_id)
        return jsonify(tariff.to_dict()), 200
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def create_tariff(current_user):
    body = request.json

    try:
        tariff = Tariff.create(**body)
        return jsonify(tariff.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def update_tariff(current_user, tariff_id):
    body = request.json
    try:
        updated = Tariff.update(tariff_id, **body)
        return jsonify(updated.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def delete_tariff(current_user, tariff_id):
    try:
        deleted = Tariff.delete_or_404(tariff_id)
        return jsonify(deleted.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404
