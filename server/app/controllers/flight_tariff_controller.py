from flask import request, jsonify

from app.models.flight_tariff import FlightTariff
from app.models.flight import Flight
from app.models.tariff import Tariff
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError


@admin_required
def get_flight_tariffs(current_user):
    flight_tariffs = FlightTariff.get_all()
    return jsonify([ft.to_dict() for ft in flight_tariffs])


@admin_required
def get_flight_tariff(current_user, flight_tariff_id):
    flight_tariff = FlightTariff.get_by_id(flight_tariff_id)
    if flight_tariff:
        return jsonify(flight_tariff.to_dict()), 200
    return jsonify({'message': 'Flight tariff not found'}), 404


@admin_required
def create_flight_tariff(current_user):
    body = request.json
    flight_id = body.get('flight_id')
    tariff_id = body.get('tariff_id')

    if flight_id is None or Flight.get_by_id(flight_id) is None:
        return jsonify({'message': 'Flight not found'}), 404
    if tariff_id is None or not Tariff.get_by_id(tariff_id):
        return jsonify({'message': 'Tariff not found'}), 404

    try:
        flight_tariff = FlightTariff.create(**body)
        return jsonify(flight_tariff.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_flight_tariff(current_user, flight_tariff_id):
    body = request.json
    flight_id = body.get('flight_id')
    tariff_id = body.get('tariff_id')

    if flight_id is None or Flight.get_by_id(flight_id) is None:
        return jsonify({'message': 'Flight not found'}), 404
    if tariff_id is None or not Tariff.get_by_id(tariff_id):
        return jsonify({'message': 'Tariff not found'}), 404

    try:
        updated = FlightTariff.update(flight_tariff_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Flight tariff not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_flight_tariff(current_user, flight_tariff_id):
    try:
        deleted = FlightTariff.delete(flight_tariff_id)
        if deleted:
            return jsonify(deleted.to_dict())
        return jsonify({'message': 'Flight tariff not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
