from flask import jsonify, request
from app.models.timezone import Timezone
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_timezones(current_user):
    timezones = Timezone.get_all()
    return jsonify([tz.to_dict() for tz in timezones])


@admin_required
def get_timezone(current_user, timezone_id):
    tz = Timezone.get_or_404(timezone_id)
    return jsonify(tz.to_dict()), 200


@admin_required
def create_timezone(current_user):
    body = request.json
    tz = Timezone.create(**body)
    return jsonify(tz.to_dict()), 201


@admin_required
def update_timezone(current_user, timezone_id):
    body = request.json
    updated = Timezone.update(timezone_id, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_timezone(current_user, timezone_id):
    deleted = Timezone.delete_or_404(timezone_id)
    return jsonify(deleted.to_dict())
