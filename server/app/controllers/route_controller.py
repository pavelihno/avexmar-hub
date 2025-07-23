from flask import request, jsonify

from app.models.route import Route
from app.models.airport import Airport
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_routes(current_user):
    routes = Route.get_all()
    return jsonify([r.to_dict() for r in routes])


@admin_required
def get_route(current_user, route_id):
    route = Route.get_or_404(route_id)
    return jsonify(route.to_dict()), 200


@admin_required
def create_route(current_user):
    body = request.json
    route = Route.create(**body)
    return jsonify(route.to_dict()), 201


@admin_required
def update_route(current_user, route_id):
    body = request.json
    updated = Route.update(route_id, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_route(current_user, route_id):
    deleted = Route.delete_or_404(route_id)
    return jsonify(deleted.to_dict())
