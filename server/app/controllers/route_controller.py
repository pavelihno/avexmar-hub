from flask import request, jsonify

from app.models.route import Route
from app.models.airport import Airport
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError, NotFoundError


@admin_required
def get_routes(current_user):
    routes = Route.get_all()
    return jsonify([r.to_dict() for r in routes])


@admin_required
def get_route(current_user, route_id):
    try:
        route = Route.get_or_404(route_id)
        return jsonify(route.to_dict()), 200
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def create_route(current_user):
    body = request.json
    try:
        route = Route.create(**body)
        return jsonify(route.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def update_route(current_user, route_id):
    body = request.json
    try:
        updated = Route.update(route_id, **body)
        return jsonify(updated.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def delete_route(current_user, route_id):
    try:
        deleted = Route.delete_or_404(route_id)
        return jsonify(deleted.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404
