from flask import request, jsonify

from app.models.consent import ConsentEvent
from app.middlewares.auth_middleware import admin_required


def get_consent_events():
    events = ConsentEvent.get_all()
    return jsonify([e.to_dict() for e in events])


def get_consent_event(event_id):
    event = ConsentEvent.get_or_404(event_id)
    return jsonify(event.to_dict()), 200


@admin_required
def create_consent_event(current_user):
    body = request.json or {}
    event = ConsentEvent.create(commit=True, **body)
    return jsonify(event.to_dict()), 201


@admin_required
def update_consent_event(current_user, event_id):
    body = request.json or {}
    event = ConsentEvent.update(event_id, commit=True, **body)
    return jsonify(event.to_dict())


@admin_required
def delete_consent_event(current_user, event_id):
    deleted = ConsentEvent.delete_or_404(event_id, commit=True)
    return jsonify(deleted)
