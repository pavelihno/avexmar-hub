from flask import request, jsonify

from app.models.discount import Discount
from app.middlewares.auth_middleware import admin_required


def get_discounts():
    discounts = Discount.get_all()
    return jsonify([d.to_dict() for d in discounts])


@admin_required
def create_discount(current_user):
    body = request.json
    discount = Discount.create(**body)
    return jsonify(discount.to_dict()), 201


@admin_required
def update_discount(current_user, discount_id):
    body = request.json
    updated = Discount.update(discount_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Discount not found'}), 404


@admin_required
def delete_discount(current_user, discount_id):
    deleted = Discount.delete(discount_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Discount not found'}), 404
