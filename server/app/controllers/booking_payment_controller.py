from flask import request, jsonify

from app.models.booking import Booking
from app.models.payment import Payment
from app.utils.payment import create_payment, handle_webhook
from app.middlewares.auth_middleware import current_user


@current_user
def create_booking_payment(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    return_url = data.get('return_url')
    if not public_id:
        return jsonify({'message': 'public_id required'}), 400

    booking = Booking.get_by_public_id(public_id)
    payment = create_payment(booking, return_url)
    return jsonify(payment.to_dict()), 201


@current_user
def get_booking_payment(current_user, public_id):
    booking = Booking.get_by_public_id(public_id)
    payment = (
        Payment.query.filter_by(booking_id=booking.id)
        .order_by(Payment.id.desc())
        .first()
    )
    if not payment:
        return jsonify({'message': 'payment not found'}), 404
    return jsonify(payment.to_dict()), 200


def payment_webhook():
    payload = request.json or {}
    handle_webhook(payload)
    return jsonify({'status': 'ok'}), 200
