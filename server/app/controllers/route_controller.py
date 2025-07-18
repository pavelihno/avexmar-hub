from flask import request, jsonify

from app.models.route import Route
from app.models.airport import Airport
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError


@admin_required
def get_routes(current_user):
    routes = Route.get_all()
    return jsonify([r.to_dict() for r in routes])


@admin_required
def get_route(current_user, route_id):
    route = Route.get_by_id(route_id)
    if route:
        return jsonify(route.to_dict()), 200
    return jsonify({'message': 'Route not found'}), 404


@admin_required
def create_route(current_user):
    body = request.json
    origin_id = body.get('origin_airport_id')
    destination_id = body.get('destination_airport_id')

    if not Airport.get_by_id(origin_id):
        return jsonify({'message': 'Origin airport not found'}), 404
    if not Airport.get_by_id(destination_id):
        return jsonify({'message': 'Destination airport not found'}), 404

    try:
        route = Route.create(**body)
        return jsonify(route.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_route(current_user, route_id):
    body = request.json
    try:
        updated = Route.update(route_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Route not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_route(current_user, route_id):
    try:
        deleted = Route.delete(route_id)
        if deleted:
            return jsonify(deleted.to_dict())
        return jsonify({'message': 'Route not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
