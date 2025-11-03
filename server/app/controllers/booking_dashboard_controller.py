from collections import defaultdict
from datetime import datetime, timedelta, timezone

from flask import request, jsonify
from sqlalchemy import func, or_, cast, String
from sqlalchemy.orm import joinedload

from app.middlewares.auth_middleware import admin_required
from app.models.booking import Booking
from app.models.booking_flight import BookingFlight
from app.models.flight_tariff import FlightTariff
from app.models.flight import Flight
from app.utils.business_logic import get_booking_snapshot
from app.utils.enum import PAYMENT_STATUS, BOOKING_STATUS
from app.utils.datetime import parse_date, combine_date_time


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


@admin_required
def get_booking_dashboard(current_user):
    params = request.args

    booking_number = (params.get('booking_number') or '').strip()
    route_id = params.get('route_id', type=int)
    flight_id = params.get('flight_id', type=int)
    buyer_query = (params.get('buyer_query') or '').strip()
    booking_date_param = (params.get('booking_date') or '').strip()

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

    if booking_date_param:
        try:
            booking_date = parse_date(booking_date_param, '%Y-%m-%d')
            start_of_day = combine_date_time(
                booking_date,
                datetime.min.time()
            )
            end_of_day = start_of_day + timedelta(days=1)
            query = query.filter(
                Booking.created_at >= start_of_day,
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
