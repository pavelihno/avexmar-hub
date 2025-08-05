from flask import request, jsonify

from app.models.discount import Discount
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_discounts(current_user):
    discounts = Discount.get_all()
    return jsonify([d.to_dict() for d in discounts])


@admin_required
def get_discount(current_user, discount_id):
    discount = Discount.get_or_404(discount_id)
    return jsonify(discount.to_dict()), 200


@admin_required
def create_discount(current_user):
    body = request.json
    discount = Discount.create(**body)
    return jsonify(discount.to_dict()), 201


@admin_required
def update_discount(current_user, discount_id):
    body = request.json
    updated = Discount.update(discount_id, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_discount(current_user, discount_id):
    deleted = Discount.delete_or_404(discount_id)
    return jsonify(deleted)
