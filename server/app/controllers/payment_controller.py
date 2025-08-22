from flask import request, jsonify

from app.models.payment import Payment
from app.models.booking import Booking
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_payments(current_user):
    payments = Payment.get_all()
    return jsonify([p.to_dict() for p in payments])


@admin_required
def get_payment(current_user, payment_id):
    payment = Payment.get_or_404(payment_id)
    return jsonify(payment.to_dict()), 200


@admin_required
def create_payment(current_user):
    body = request.json
    payment = Payment.create(**body)
    return jsonify(payment.to_dict()), 201


@admin_required
def update_payment(current_user, payment_id):
    body = request.json
    updated = Payment.update(payment_id, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_payment(current_user, payment_id):
    deleted = Payment.delete_or_404(payment_id, commit=True)
    return jsonify(deleted)
