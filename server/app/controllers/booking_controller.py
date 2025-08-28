from flask import request, jsonify
import uuid

from app.database import db
from app.models.booking import Booking
from app.models.booking_passenger import BookingPassenger
from app.models.passenger import Passenger
from app.utils.enum import BOOKING_STATUS, USER_ROLE
from app.middlewares.auth_middleware import admin_required, login_required


@admin_required
def get_bookings(current_user):
    bookings = Booking.get_all()
    return jsonify([booking.to_dict() for booking in bookings])


@login_required
def get_booking(current_user, booking_id):
    booking = Booking.get_or_404(booking_id)
    if current_user.role != USER_ROLE.admin and booking.user_id != current_user.id:
        return jsonify({'message': 'Forbidden'}), 403
    return jsonify(booking.to_dict()), 200


@admin_required
def create_booking(current_user):
    session = db.session
    body = request.json
    booking = Booking.create(session, commit=True, **body)
    return jsonify(booking.to_dict()), 201


@admin_required
def update_booking(current_user, booking_id):
    session = db.session
    body = request.json
    updated = Booking.update(booking_id, session=session, commit=True, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_booking(current_user, booking_id):
    session = db.session
    deleted = Booking.delete_or_404(booking_id, session=session, commit=True)
    return jsonify(deleted)


def search_booking():
    data = request.json or {}
    booking_number = data.get('booking_number')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    if not all([booking_number, first_name, last_name]):
        return (
            jsonify({'message': 'booking_number, first_name and last_name required'}),
            400,
        )

    first_name = str(first_name).upper()
    last_name = str(last_name).upper()

    booking = (
        db.session.query(Booking)
        .join(BookingPassenger, BookingPassenger.booking_id == Booking.id)
        .join(Passenger, BookingPassenger.passenger_id == Passenger.id)
        .filter(
            Booking.booking_number == booking_number,
            Passenger.first_name == first_name,
            Passenger.last_name == last_name,
            Booking.status == BOOKING_STATUS.completed,
        )
        .first()
    )

    if not booking:
        return jsonify({'message': 'booking not found'}), 404

    if not booking.access_token:
        booking = Booking.update(
            booking.id,
            session=db.session,
            commit=True,
            access_token=uuid.uuid4(),
        )

    return (
        jsonify(
            {
                'message': 'booking found',
                'data': {
                    'public_id': str(booking.public_id),
                    'access_token': str(booking.access_token),
                },
            }
        ),
        200,
    )
