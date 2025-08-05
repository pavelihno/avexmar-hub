from flask import request, jsonify

from app.models.tariff import Tariff
from app.middlewares.auth_middleware import admin_required


def get_tariffs():
    tariffs = Tariff.get_all()
    return jsonify([t.to_dict() for t in tariffs])


def get_tariff(tariff_id):
    tariff = Tariff.get_or_404(tariff_id)
    return jsonify(tariff.to_dict()), 200


@admin_required
def create_tariff(current_user):
    body = request.json
    tariff = Tariff.create(**body)
    return jsonify(tariff.to_dict()), 201


@admin_required
def update_tariff(current_user, tariff_id):
    body = request.json
    updated = Tariff.update(tariff_id, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_tariff(current_user, tariff_id):
    deleted = Tariff.delete_or_404(tariff_id)
    return jsonify(deleted)
