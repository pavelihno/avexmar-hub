from flask import request, jsonify

from app.models.discount import Discount
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError, NotFoundError


@admin_required
def get_discounts(current_user):
    discounts = Discount.get_all()
    return jsonify([d.to_dict() for d in discounts])


@admin_required
def get_discount(current_user, discount_id):
    try:
        discount = Discount.get_or_404(discount_id)
        return jsonify(discount.to_dict()), 200
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def create_discount(current_user):
    body = request.json
    try:
        discount = Discount.create(**body)
        return jsonify(discount.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def update_discount(current_user, discount_id):
    body = request.json
    try:
        updated = Discount.update(discount_id, **body)
        return jsonify(updated.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def delete_discount(current_user, discount_id):
    try:
        deleted = Discount.delete_or_404(discount_id)
        return jsonify(deleted.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404
