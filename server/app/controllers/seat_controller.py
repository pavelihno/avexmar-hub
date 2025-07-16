from flask import request, jsonify

from app.models.seat import Seat
from app.models.tariff import Tariff
from app.models.booking import Booking
from app.models._base_model import ModelValidationError
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_seats(current_user):
    seats = Seat.get_all()
    return jsonify([s.to_dict() for s in seats])


@admin_required
def get_seat(current_user, seat_id):
    seat = Seat.get_by_id(seat_id)
    if seat:
        return jsonify(seat.to_dict()), 200
    return jsonify({'message': 'Seat not found'}), 404


@admin_required
def create_seat(current_user):
    body = request.json
    tariff_id = body.get('tariff_id')
    booking_id = body.get('booking_id')

    if not Tariff.get_by_id(tariff_id):
        return jsonify({'message': 'Tariff not found'}), 404
    if booking_id is not None and not Booking.get_by_id(booking_id):
        return jsonify({'message': 'Booking not found'}), 404

    try:
        seat = Seat.create(**body)
        return jsonify(seat.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_seat(current_user, seat_id):
    body = request.json
    tariff_id = body.get('tariff_id')
    booking_id = body.get('booking_id')

    if tariff_id is not None and not Tariff.get_by_id(tariff_id):
        return jsonify({'message': 'Tariff not found'}), 404
    if booking_id is not None and not Booking.get_by_id(booking_id):
        return jsonify({'message': 'Booking not found'}), 404

    try:
        updated = Seat.update(seat_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Seat not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_seat(current_user, seat_id):
    deleted = Seat.delete(seat_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Seat not found'}), 404
