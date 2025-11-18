from flask import request, jsonify

from app.models.tariff_fee import TariffFee
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_tariff_fees(current_user):
    tariff_fees = TariffFee.get_all()
    return jsonify([tf.to_dict() for tf in tariff_fees]), 200


@admin_required
def get_tariff_fee(current_user, tariff_fee_id):
    tariff_fee = TariffFee.get_or_404(tariff_fee_id)
    return jsonify(tariff_fee.to_dict()), 200


@admin_required
def create_tariff_fee(current_user):
    body = request.json
    tariff_fee = TariffFee.create(commit=True, **body)
    return jsonify(tariff_fee.to_dict()), 201


@admin_required
def update_tariff_fee(current_user, tariff_fee_id):
    body = request.json
    updated = TariffFee.update(tariff_fee_id, commit=True, **body)
    return jsonify(updated.to_dict()), 200


@admin_required
def delete_tariff_fee(current_user, tariff_fee_id):
    deleted = TariffFee.delete_or_404(tariff_fee_id, commit=True)
    return jsonify(deleted), 200
