from collections import defaultdict
from datetime import datetime, timedelta, timezone

from flask import request, jsonify
from sqlalchemy import func, or_, cast, String
from sqlalchemy.orm import joinedload

from app.constants.messages import BookingMessages
from app.middlewares.auth_middleware import admin_required
from app.models.booking import Booking
from app.models.booking_flight import BookingFlight
from app.models.booking_flight_passenger import BookingFlightPassenger
from app.models.flight_tariff import FlightTariff
from app.models.flight import Flight
from app.models.ticket import Ticket
from app.utils.business_logic import get_booking_snapshot
from app.utils.email import EMAIL_TYPE, send_email, EmailError
from app.utils.enum import (
    PAYMENT_STATUS,
    BOOKING_STATUS,
    BOOKING_FLIGHT_PASSENGER_STATUS,
)
from app.utils.datetime import parse_date_formats, combine_date_time
from app.utils.yookassa import refund_payment
from app.utils.passenger_categories import PASSENGER_WITH_SEAT_CATEGORIES


def _calculate_booking_issues(booking, payments_snapshot):
    status = booking.status
    hold = booking.booking_hold
    hold_expires_at = hold.expires_at if hold else None
    hold_expired = bool(
        hold_expires_at and hold_expires_at < datetime.now(
            timezone.utc).replace(tzinfo=None)
    )

    pending_payment = any(
        (payment or {}).get('payment_status') in {
            PAYMENT_STATUS.pending.value,
            PAYMENT_STATUS.waiting_for_capture.value,
        }
        for payment in payments_snapshot
    )
    failed_payment = any(
        (payment or {}).get('payment_status') == PAYMENT_STATUS.canceled.value
        for payment in payments_snapshot
    )

    if hold_expired or status in {
        BOOKING_STATUS.completed,
        BOOKING_STATUS.cancelled,
        BOOKING_STATUS.expired,
    }:
        pending_payment = False

    return {
        'pending_payment': pending_payment,
        'failed_payment': failed_payment,
    }


def _calculate_ticket_issue_flags(booking_snapshot):
    flights = (booking_snapshot or {}).get('flights') or []
    refund_requested = False
    issuing_in_progress = False
    tickets_to_issue = False

    for flight in flights:
        tickets = (flight or {}).get('tickets') or []
        for ticket in tickets:
            status = (ticket or {}).get('status')
            if not status:
                continue

            if status in {
                BOOKING_FLIGHT_PASSENGER_STATUS.created.value,
            }:
                tickets_to_issue = True

            if status in {
                BOOKING_FLIGHT_PASSENGER_STATUS.refund_in_progress.value,
            }:
                refund_requested = True

            if status in {
                BOOKING_FLIGHT_PASSENGER_STATUS.ticket_in_progress.value,
            }:
                issuing_in_progress = True

        if refund_requested and issuing_in_progress and tickets_to_issue:
            break

    return {
        'ticket_refund': refund_requested,
        'ticket_in_progress': issuing_in_progress,
        'ticket_to_issue': tickets_to_issue,
    }


def _get_booking_ticket_context(booking_id: int, ticket_id: int):
    booking = Booking.get_or_404(booking_id)
    ticket = Ticket.get_or_404(ticket_id)

    booking_flight_passenger = ticket.booking_flight_passenger
    booking_flight = BookingFlight.query.join(
        FlightTariff, FlightTariff.id == BookingFlight.flight_tariff_id
    ).filter(
        BookingFlight.booking_id == booking.id,
        FlightTariff.flight_id == booking_flight_passenger.flight_id,
    ).first_or_404()

    return booking, ticket, booking_flight_passenger, booking_flight


def _build_ticket_refund_payload(booking, ticket, booking_flight_passenger):
    booking_passenger = booking_flight_passenger.booking_passenger if booking_flight_passenger else None
    passenger = booking_passenger.get_passenger_details() if booking_passenger else {}
    flight = booking_flight_passenger.flight

    return {
        'booking': {
            'id': booking.id,
            'booking_number': booking.booking_number,
            'public_id': str(booking.public_id) if booking.public_id else None,
        },
        'ticket': {
            'id': ticket.id,
            'ticket_number': ticket.ticket_number,
            'status': (
                booking_flight_passenger.status.value
                if booking_flight_passenger.status
                else None
            ),
            'refund_request_at': (
                booking_flight_passenger.refund_request_at.isoformat()
                if booking_flight_passenger.refund_request_at
                else None
            ),
            'refund_decision_at': (
                booking_flight_passenger.refund_decision_at.isoformat()
                if booking_flight_passenger.refund_decision_at
                else None
            ),
            'passenger': passenger,
            'flight': flight.to_dict(return_children=True) if flight else {},
        },
    }


def _send_ticket_refund_rejected_email(booking, ticket, rejection_reason=None):
    if not booking.email_address:
        return False

    try:
        send_email(
            EMAIL_TYPE.ticket_refund_rejected,
            recipients=[booking.email_address],
            booking_number=booking.booking_number,
            ticket_number=ticket.ticket_number,
            rejection_reason=rejection_reason,
        )
    except EmailError:
        return False
    return True


@admin_required
def get_booking_dashboard(current_user):
    params = request.args

    booking_number = (params.get('booking_number') or '').strip()
    route_id = params.get('route_id', type=int)
    flight_id = params.get('flight_id', type=int)
    buyer_query = (params.get('buyer_query') or '').strip()
    booking_date_param = (params.get('booking_date') or '').strip()
    booking_date_from_param = (params.get('booking_date_from') or '').strip()
    booking_date_to_param = (params.get('booking_date_to') or '').strip()

    if booking_date_param and not (booking_date_from_param or booking_date_to_param):
        booking_date_from_param = booking_date_param
        booking_date_to_param = booking_date_param

    query = Booking.query.options(
        joinedload(Booking.user),
        joinedload(Booking.booking_hold),
    )

    joined_booking_flights = False
    joined_flight_tariffs = False
    joined_flights = False

    if booking_number:
        like_pattern = f'%{booking_number}%'
        query = query.filter(
            or_(
                Booking.booking_number.ilike(like_pattern),
                cast(Booking.public_id, String).ilike(like_pattern),
            )
        )

    if buyer_query:
        lowered = f"%{buyer_query.lower()}%"
        query = query.filter(
            or_(
                func.lower(Booking.buyer_first_name).like(lowered),
                func.lower(Booking.buyer_last_name).like(lowered),
                func.lower(
                    func.concat(
                        Booking.buyer_last_name,
                        ' ',
                        Booking.buyer_first_name
                    )
                ).like(lowered),
                func.lower(Booking.email_address).like(lowered),
                func.lower(Booking.phone_number).like(lowered),
            )
        )

    if route_id:
        if not joined_booking_flights:
            query = query.join(
                BookingFlight, BookingFlight.booking_id == Booking.id
            )
            joined_booking_flights = True
        if not joined_flight_tariffs:
            query = query.join(
                FlightTariff, FlightTariff.id == BookingFlight.flight_tariff_id
            )
            joined_flight_tariffs = True
        if not joined_flights:
            query = query.join(Flight, Flight.id == FlightTariff.flight_id)
            joined_flights = True
        query = query.filter(Flight.route_id == route_id)

    if flight_id:
        if not joined_booking_flights:
            query = query.join(
                BookingFlight, BookingFlight.booking_id == Booking.id
            )
            joined_booking_flights = True
        if not joined_flight_tariffs:
            query = query.join(
                FlightTariff, FlightTariff.id == BookingFlight.flight_tariff_id
            )
            joined_flight_tariffs = True
        query = query.filter(FlightTariff.flight_id == flight_id)

    if booking_date_from_param or booking_date_to_param:
        try:
            booking_date_from = parse_date_formats(booking_date_from_param)
            booking_date_to = parse_date_formats(booking_date_to_param)

            start_of_day = combine_date_time(
                booking_date_from,
                datetime.min.time()
            ) if booking_date_from else None
            end_of_day = combine_date_time(
                booking_date_to,
                datetime.min.time()
            ) + timedelta(days=1) if booking_date_to else None

            if start_of_day and end_of_day:
                query = query.filter(
                    Booking.created_at >= start_of_day,
                    Booking.created_at < end_of_day,
                )
            elif start_of_day:
                query = query.filter(
                    Booking.created_at >= start_of_day,
                )
            elif end_of_day:
                query = query.filter(
                    Booking.created_at < end_of_day,
                )
        except ValueError:
            pass

    if joined_booking_flights:
        query = query.distinct()

    bookings = query.order_by(Booking.created_at.desc()).all()

    status_counts: dict[str, int] = defaultdict(int)
    issue_counts: dict[str, int] = defaultdict(int)
    routes_index: dict[int, dict] = {}
    flights_index: dict[int, dict] = {}

    items = []

    for booking in bookings:
        booking_snapshot = get_booking_snapshot(booking)
        booking_status = booking.status.value if booking.status else None
        if booking_status:
            status_counts[booking_status] += 1

        snapshot_payments = booking_snapshot.get('payments') or []
        issues = _calculate_booking_issues(booking, snapshot_payments)
        ticket_issue_flags = _calculate_ticket_issue_flags(booking_snapshot)
        issues.update(ticket_issue_flags)

        for key, value in issues.items():
            if value:
                issue_counts[key] += 1

        snapshot_flights = booking_snapshot.get('flights') or []
        for flight in snapshot_flights:
            route = (flight or {}).get('route') or {}
            route_id_value = route.get('id')
            if route_id_value and route_id_value not in routes_index:
                routes_index[route_id_value] = route

            flight_id_value = (flight or {}).get('id')
            if flight_id_value and flight_id_value not in flights_index:
                flights_index[flight_id_value] = {
                    **flight,
                    'route_id': route_id_value,
                }

        items.append(
            {
                'id': booking.id,
                'status': booking_status,
                'status_history': booking.status_history or [],
                'user': {
                    'id': booking.user.id if booking.user else None,
                    'email': booking.user.email if booking.user else None,
                },
                'hold': {
                    'expires_at': (
                        booking.booking_hold.expires_at.isoformat()
                        if booking.booking_hold and booking.booking_hold.expires_at
                        else None
                    ),
                },
                'issues': issues,
                'created_at': booking.created_at.isoformat() if booking.created_at else None,
                'snapshot': booking_snapshot,
            }
        )

    routes_filters = sorted(
        routes_index.values(),
        key=lambda r: r.get('label') or '',
    )
    flights_filters = sorted(
        [
            flight_data
            for flight_data in flights_index.values()
        ],
        key=lambda f: (
            f.get('route_id') or 0,
            f.get('scheduled_departure') or '',
        ),
    )

    response = {
        'items': items,
        'summary': {
            'total': len(items),
            'status_counts': dict(status_counts),
            'issue_counts': dict(issue_counts),
        },
        'filters': {
            'routes': routes_filters,
            'flights': flights_filters,
        },
    }

    return jsonify(response), 200


@admin_required
def get_booking_ticket_refund_details(current_user, booking_id, ticket_id):
    booking, ticket, booking_flight_passenger, booking_flight = _get_booking_ticket_context(
        booking_id,
        ticket_id,
    )

    payload = _build_ticket_refund_payload(
        booking,
        ticket,
        booking_flight_passenger,
    )

    return jsonify(payload), 200


@admin_required
def confirm_booking_ticket_refund(current_user, booking_id, ticket_id):
    booking, ticket, booking_flight_passenger, booking_flight = _get_booking_ticket_context(
        booking_id,
        ticket_id,
    )

    if not booking_flight_passenger:
        return jsonify({'message': BookingMessages.TICKET_NOT_FOUND}), 404

    status = booking_flight_passenger.status
    if status != BOOKING_FLIGHT_PASSENGER_STATUS.refund_in_progress:
        return jsonify({'message': BookingMessages.TICKET_REFUND_STATUS_NOT_ALLOWED}), 400

    try:
        payment = refund_payment(booking, ticket)

        updated_bfp = BookingFlightPassenger.update(
            booking_flight_passenger.id,
            status=BOOKING_FLIGHT_PASSENGER_STATUS.refunded,
            refund_decision_at=datetime.now(),
            commit=False,
        )

        if booking_flight_passenger.booking_passenger.category in PASSENGER_WITH_SEAT_CATEGORIES:
            updated_bf = BookingFlight.update(
                booking_flight.id,
                seats_number=booking_flight.seats_number - 1,
                commit=True,
            )

    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400

    payload = _build_ticket_refund_payload(
        booking,
        ticket,
        updated_bfp,
    )

    return jsonify({**payload, 'success': True, 'action': 'confirm'}), 200


@admin_required
def reject_booking_ticket_refund(current_user, booking_id, ticket_id):
    booking, ticket, booking_flight_passenger, booking_flight = _get_booking_ticket_context(
        booking_id,
        ticket_id,
    )

    if not booking_flight_passenger:
        return jsonify({'message': BookingMessages.TICKET_NOT_FOUND}), 404

    if booking_flight_passenger.status != BOOKING_FLIGHT_PASSENGER_STATUS.refund_in_progress:
        return jsonify({'message': BookingMessages.TICKET_REFUND_STATUS_NOT_ALLOWED}), 400

    request_data = request.get_json() or {}
    rejection_reason = request_data.get('rejection_reason', '').strip()

    updated_bfp = BookingFlightPassenger.update(
        booking_flight_passenger.id,
        status=BOOKING_FLIGHT_PASSENGER_STATUS.refund_rejected,
        refund_decision_at=datetime.now(),
        commit=True,
    )

    _send_ticket_refund_rejected_email(booking, ticket, rejection_reason)

    payload = _build_ticket_refund_payload(
        booking,
        ticket,
        updated_bfp,
    )

    return jsonify({**payload, 'success': True, 'action': 'reject'}), 200
