from flask import request, jsonify

from app.models.flight_tariff import FlightTariff
from app.models.flight import Flight
from app.models.tariff import Tariff
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError, NotFoundError


@admin_required
def get_flight_tariffs(current_user):
    flight_tariffs = FlightTariff.get_all()
    return jsonify([ft.to_dict() for ft in flight_tariffs])


@admin_required
def get_flight_tariff(current_user, flight_tariff_id):
    try:
        flight_tariff = FlightTariff.get_or_404(flight_tariff_id)
        return jsonify(flight_tariff.to_dict()), 200
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def create_flight_tariff(current_user):
    body = request.json
    try:
        flight_tariff = FlightTariff.create(**body)
        return jsonify(flight_tariff.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def update_flight_tariff(current_user, flight_tariff_id):
    body = request.json
    try:
        updated = FlightTariff.update(flight_tariff_id, **body)
        return jsonify(updated.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def delete_flight_tariff(current_user, flight_tariff_id):
    try:
        deleted = FlightTariff.delete_or_404(flight_tariff_id)
        return jsonify(deleted.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404
