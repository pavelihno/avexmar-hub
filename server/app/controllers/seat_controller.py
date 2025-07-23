from flask import request, jsonify

from app.models.seat import Seat
from app.models.tariff import Tariff
from app.models.booking import Booking
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_seats(current_user):
    seats = Seat.get_all()
    return jsonify([s.to_dict() for s in seats])


@admin_required
def get_seat(current_user, seat_id):
    seat = Seat.get_or_404(seat_id)
    return jsonify(seat.to_dict()), 200


@admin_required
def create_seat(current_user):
    body = request.json
    seat = Seat.create(**body)
    return jsonify(seat.to_dict()), 201


@admin_required
def update_seat(current_user, seat_id):
    body = request.json
    updated = Seat.update(seat_id, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_seat(current_user, seat_id):
    deleted = Seat.delete_or_404(seat_id)
    return jsonify(deleted.to_dict())
