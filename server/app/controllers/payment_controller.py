from flask import request, jsonify

from app.models.payment import Payment
from app.models.booking import Booking
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError


@admin_required
def get_payments(current_user):
    payments = Payment.get_all()
    return jsonify([p.to_dict() for p in payments])


@admin_required
def get_payment(current_user, payment_id):
    payment = Payment.get_by_id(payment_id)
    if payment:
        return jsonify(payment.to_dict()), 200
    return jsonify({'message': 'Payment not found'}), 404


@admin_required
def create_payment(current_user):
    body = request.json
    booking_id = body.get('booking_id')

    if not Booking.get_by_id(booking_id):
        return jsonify({'message': 'Booking not found'}), 404

    try:
        payment = Payment.create(**body)
        return jsonify(payment.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_payment(current_user, payment_id):
    body = request.json
    try:
        updated = Payment.update(payment_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Payment not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_payment(current_user, payment_id):
    deleted = Payment.delete(payment_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Payment not found'}), 404
