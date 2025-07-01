from flask import request, jsonify

from models.payment import Payment
from models.booking import Booking
from middlewares.auth_middleware import login_required


def get_payments(current_user=None):
    payments = Payment.get_all()
    return jsonify([p.to_dict() for p in payments])


@login_required
def create_payment(current_user):
    body = request.json
    booking_id = body.get('booking_id')

    if not Booking.get_by_id(booking_id):
        return jsonify({'message': 'Booking not found'}), 404

    payment = Payment.create(**body)
    return jsonify(payment.to_dict()), 201


@login_required
def update_payment(current_user, payment_id):
    body = request.json
    updated = Payment.update(payment_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Payment not found'}), 404


@login_required
def delete_payment(current_user, payment_id):
    deleted = Payment.delete(payment_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Payment not found'}), 404
