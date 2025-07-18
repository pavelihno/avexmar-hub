from flask import request, jsonify

from app.models.ticket import Ticket
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError


@admin_required
def get_tickets(current_user):
    tickets = Ticket.get_all()
    return jsonify([ticket.to_dict() for ticket in tickets])


@admin_required
def get_ticket(current_user, ticket_id):
    ticket = Ticket.get_by_id(ticket_id)
    if ticket:
        return jsonify(ticket.to_dict()), 200
    return jsonify({'message': 'Ticket not found'}), 404


@admin_required
def create_ticket(current_user):
    body = request.json
    try:
        ticket = Ticket.create(**body)
        return jsonify(ticket.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_ticket(current_user, ticket_id):
    body = request.json
    try:
        updated = Ticket.update(ticket_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Ticket not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_ticket(current_user, ticket_id):
    try:
        deleted = Ticket.delete(ticket_id)
        if deleted:
            return jsonify(deleted.to_dict())
        return jsonify({'message': 'Ticket not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
