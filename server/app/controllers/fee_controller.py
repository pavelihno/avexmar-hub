from flask import request, jsonify

from app.models.fee import Fee
from app.middlewares.auth_middleware import admin_required


def get_fees():
    fees = Fee.get_all()
    return jsonify([f.to_dict() for f in fees])


def get_fee(fee_id):
    fee = Fee.get_or_404(fee_id)
    return jsonify(fee.to_dict())


@admin_required
def create_fee(current_user):
    data = request.get_json()
    fee = Fee.create(**data)
    return jsonify(fee.to_dict()), 201


@admin_required
def update_fee(current_user, fee_id):
    data = request.get_json()
    updated = Fee.update(fee_id, **data)
    return jsonify(updated.to_dict())


@admin_required
def delete_fee(current_user, fee_id):
    deleted = Fee.delete_or_404(fee_id)
    return jsonify(deleted)
