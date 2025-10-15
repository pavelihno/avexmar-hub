from flask import request, jsonify

from app.models.ticket import Ticket
from app.middlewares.auth_middleware import admin_required


@admin_required
def get_tickets(current_user):
    tickets = Ticket.get_all()
    return jsonify([ticket.to_dict() for ticket in tickets]), 200


@admin_required
def get_ticket(current_user, ticket_id):
    ticket = Ticket.get_or_404(ticket_id)
    return jsonify(ticket.to_dict()), 200


@admin_required
def create_ticket(current_user):
    body = request.json
    ticket = Ticket.create(commit=True, **body)
    return jsonify(ticket.to_dict()), 201


@admin_required
def update_ticket(current_user, ticket_id):
    body = request.json
    updated = Ticket.update(ticket_id, commit=True, **body)
    return jsonify(updated.to_dict()), 200


@admin_required
def delete_ticket(current_user, ticket_id):
    deleted = Ticket.delete_or_404(ticket_id, commit=True)
    return jsonify(deleted), 200
