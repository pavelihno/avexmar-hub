from flask import request, jsonify

from models.booking import Booking
from models.flight import Flight
from middlewares.auth_middleware import login_required


def get_bookings(current_user=None):
    bookings = Booking.get_all()
    return jsonify([booking.to_dict() for booking in bookings])


@login_required
def create_booking(current_user):
    body = request.json
    flight_id = body.get('flight_id')

    if not Flight.get_by_id(flight_id):
        return jsonify({'message': 'Flight not found'}), 404

    booking = Booking.create(**body)
    return jsonify(booking.to_dict()), 201


@login_required
def update_booking(current_user, booking_id):
    body = request.json
    updated = Booking.update(booking_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Booking not found'}), 404


@login_required
def delete_booking(current_user, booking_id):
    deleted = Booking.delete(booking_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Booking not found'}), 404
