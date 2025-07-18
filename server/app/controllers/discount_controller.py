from flask import request, jsonify

from app.models.discount import Discount
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError


@admin_required
def get_discounts(current_user):
    discounts = Discount.get_all()
    return jsonify([d.to_dict() for d in discounts])


@admin_required
def get_discount(current_user, discount_id):
    discount = Discount.get_by_id(discount_id)
    if discount:
        return jsonify(discount.to_dict()), 200
    return jsonify({'message': 'Discount not found'}), 404


@admin_required
def create_discount(current_user):
    body = request.json
    try:
        discount = Discount.create(**body)
        return jsonify(discount.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_discount(current_user, discount_id):
    body = request.json
    try:
        updated = Discount.update(discount_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Discount not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_discount(current_user, discount_id):
    try:
        deleted = Discount.delete(discount_id)
        if deleted:
            return jsonify(deleted.to_dict())
        return jsonify({'message': 'Discount not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
