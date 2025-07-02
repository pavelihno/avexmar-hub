from flask import request, jsonify

from models.route import Route
from models.airport import Airport
from middlewares.auth_middleware import admin_required


def get_routes():
    routes = Route.get_all()
    return jsonify([r.to_dict() for r in routes])


@admin_required
def create_route(current_user):
    body = request.json
    origin_id = body.get('origin_airport_id')
    destination_id = body.get('destination_airport_id')

    if not Airport.get_by_id(origin_id):
        return jsonify({'message': 'Origin airport not found'}), 404
    if not Airport.get_by_id(destination_id):
        return jsonify({'message': 'Destination airport not found'}), 404

    route = Route.create(**body)
    return jsonify(route.to_dict()), 201


@admin_required
def update_route(current_user, route_id):
    body = request.json
    updated = Route.update(route_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Route not found'}), 404


@admin_required
def delete_route(current_user, route_id):
    deleted = Route.delete(route_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Route not found'}), 404
