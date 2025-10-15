from flask import request, jsonify

from app.models.route import Route
from app.models.airport import Airport
from app.middlewares.auth_middleware import admin_required


def get_routes():
    routes = Route.get_all()
    return jsonify([r.to_dict(return_children=True) for r in routes]), 200


def get_route(route_id):
    route = Route.get_or_404(route_id)
    return jsonify(route.to_dict(return_children=True)), 200


@admin_required
def create_route(current_user):
    body = request.json
    route = Route.create(commit=True, **body)
    return jsonify(route.to_dict()), 201


@admin_required
def update_route(current_user, route_id):
    body = request.json
    updated = Route.update(route_id, commit=True, **body)
    return jsonify(updated.to_dict()), 200


@admin_required
def delete_route(current_user, route_id):
    deleted = Route.delete_or_404(route_id, commit=True)
    return jsonify(deleted), 200
