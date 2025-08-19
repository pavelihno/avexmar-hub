from flask import request, jsonify

from app.database import db
from app.models.booking import Booking
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_bookings(current_user):
    bookings = Booking.get_all()
    return jsonify([booking.to_dict() for booking in bookings])


@admin_required
def get_booking(current_user, booking_id):
    booking = Booking.get_or_404(booking_id)
    return jsonify(booking.to_dict()), 200


@admin_required
def create_booking(current_user):
    session = db.session
    body = request.json
    booking = Booking.create(session, **body)
    return jsonify(booking.to_dict()), 201


@admin_required
def update_booking(current_user, booking_id):
    session = db.session
    body = request.json
    updated = Booking.update(booking_id, session=session, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_booking(current_user, booking_id):
    session = db.session
    deleted = Booking.delete_or_404(booking_id, session=session)
    return jsonify(deleted)
