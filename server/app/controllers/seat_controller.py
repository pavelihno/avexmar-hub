from flask import request, jsonify

from models.seat import Seat
from models.flight import Flight
from models.tariff import Tariff
from models.passenger import Passenger
from middlewares.auth_middleware import login_required


def get_seats(current_user=None):
    seats = Seat.get_all()
    return jsonify([s.to_dict() for s in seats])


@login_required
def create_seat(current_user):
    body = request.json
    flight_id = body.get('flight_id')
    tariff_id = body.get('tariff_id')
    passenger_id = body.get('passenger_id')

    if not Flight.get_by_id(flight_id):
        return jsonify({'message': 'Flight not found'}), 404
    if not Tariff.get_by_id(tariff_id):
        return jsonify({'message': 'Tariff not found'}), 404
    if passenger_id is not None and not Passenger.get_by_id(passenger_id):
        return jsonify({'message': 'Passenger not found'}), 404

    seat = Seat.create(**body)
    return jsonify(seat.to_dict()), 201


@login_required
def update_seat(current_user, seat_id):
    body = request.json
    flight_id = body.get('flight_id')
    tariff_id = body.get('tariff_id')
    passenger_id = body.get('passenger_id')

    if flight_id is not None and not Flight.get_by_id(flight_id):
        return jsonify({'message': 'Flight not found'}), 404
    if tariff_id is not None and not Tariff.get_by_id(tariff_id):
        return jsonify({'message': 'Tariff not found'}), 404
    if passenger_id is not None and not Passenger.get_by_id(passenger_id):
        return jsonify({'message': 'Passenger not found'}), 404

    updated = Seat.update(seat_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Seat not found'}), 404


@login_required
def delete_seat(current_user, seat_id):
    deleted = Seat.delete(seat_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Seat not found'}), 404
