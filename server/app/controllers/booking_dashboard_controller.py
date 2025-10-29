from collections import defaultdict
from datetime import datetime, timedelta

from flask import request, jsonify
from sqlalchemy import func, or_, cast, String
from sqlalchemy.orm import joinedload

from app.database import db
from app.middlewares.auth_middleware import admin_required
from app.models.booking import Booking
from app.models.booking_flight import BookingFlight
from app.models.booking_passenger import BookingPassenger
from app.models.flight import Flight
from app.models.passenger import Passenger
from app.models.payment import Payment
from app.models.route import Route
from app.utils.enum import PAYMENT_STATUS, BOOKING_STATUS


def _format_route(route: Route):
    if not route:
        return {}

    origin = route.origin_airport
    destination = route.destination_airport

    return {
        'id': route.id,
        'origin': {
            'id': origin.id if origin else None,
            'city': origin.city_name if origin else None,
            'code': origin.iata_code if origin else None,
        },
        'destination': {
            'id': destination.id if destination else None,
            'city': destination.city_name if destination else None,
            'code': destination.iata_code if destination else None,
        },
        'label': (
            f"{origin.city_name if origin else ''} — {destination.city_name if destination else ''}"
        ).strip(' —'),
    }


def _format_passenger(bp: BookingPassenger, passenger: Passenger):
    return {
        'id': passenger.id,
        'category': bp.category.value if bp.category else None,
        'first_name': passenger.first_name,
        'last_name': passenger.last_name,
        'patronymic_name': passenger.patronymic_name,
        'birth_date': passenger.birth_date.isoformat() if passenger.birth_date else None,
        'document_type': passenger.document_type.value if passenger.document_type else None,
        'document_number': passenger.document_number,
        'document_expiry_date': passenger.document_expiry_date.isoformat() if passenger.document_expiry_date else None,
        'citizenship': passenger.citizenship.code_a2 if passenger.citizenship else None,
    }


def _format_flight(bf: BookingFlight, flight: Flight):
    route = _format_route(flight.route if flight else None)

    return {
        'id': flight.id if flight else None,
        'number': flight.airline_flight_number if flight else None,
        'scheduled_departure': (
            flight.scheduled_departure.isoformat(
            ) if flight and flight.scheduled_departure else None
        ),
        'scheduled_departure_time': (
            flight.scheduled_departure_time.isoformat(
            ) if flight and flight.scheduled_departure_time else None
        ),
        'scheduled_arrival': (
            flight.scheduled_arrival.isoformat() if flight and flight.scheduled_arrival else None
        ),
        'scheduled_arrival_time': (
            flight.scheduled_arrival_time.isoformat(
            ) if flight and flight.scheduled_arrival_time else None
        ),
        'route': route,
        'airline': flight.airline.name if flight and flight.airline else None,
        'tariff': {
            'id': bf.tariff.id if bf.tariff else None,
            'title': bf.tariff.title if bf.tariff else None,
            'seat_class': bf.tariff.seat_class.value if bf.tariff and bf.tariff.seat_class else None,
        },
    }


def _format_payment(payment: Payment):
    return {
        'id': payment.id,
        'provider_payment_id': payment.provider_payment_id,
        'status': payment.payment_status.value if payment.payment_status else None,
        'method': payment.payment_method.value if payment.payment_method else None,
        'type': payment.payment_type.value if payment.payment_type else None,
        'amount': float(payment.amount) if payment.amount is not None else None,
        'currency': payment.currency.value if payment.currency else None,
        'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
        'expires_at': payment.expires_at.isoformat() if payment.expires_at else None,
    }


def _calculate_booking_issues(booking, payments):
    status = booking.status
    hold = booking.booking_hold
    hold_expires_at = hold.expires_at if hold else None
    hold_expired = bool(hold_expires_at and hold_expires_at < datetime.utcnow())

    pending_payment = any(
        payment.payment_status in {PAYMENT_STATUS.pending, PAYMENT_STATUS.waiting_for_capture}
        for payment in payments
    )
    failed_payment = any(payment.payment_status == PAYMENT_STATUS.canceled for payment in payments)

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
                func.lower(func.concat(Booking.buyer_last_name, ' ',
                           Booking.buyer_first_name)).like(lowered),
                func.lower(Booking.email_address).like(lowered),
                func.lower(Booking.phone_number).like(lowered),
            )
        )

    if route_id:
        if not joined_booking_flights:
            query = query.join(
                BookingFlight, BookingFlight.booking_id == Booking.id)
            joined_booking_flights = True
        if not joined_flights:
            query = query.join(Flight, Flight.id == BookingFlight.flight_id)
            joined_flights = True
        query = query.filter(Flight.route_id == route_id)

    if flight_id:
        if not joined_booking_flights:
            query = query.join(
                BookingFlight, BookingFlight.booking_id == Booking.id)
            joined_booking_flights = True
        query = query.filter(BookingFlight.flight_id == flight_id)

    if booking_date_param:
        try:
            booking_date = datetime.strptime(
                booking_date_param, '%Y-%m-%d').date()
            start_of_day = datetime.combine(booking_date, datetime.min.time())
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

    booking_ids = [booking.id for booking in bookings]

    passengers_map: dict[int, list[BookingPassenger]] = defaultdict(list)
    flights_map: dict[int, list[BookingFlight]] = defaultdict(list)
    payments_map: dict[int, list[Payment]] = defaultdict(list)

    if booking_ids:
        for bp in (
            db.session.query(BookingPassenger)
            .options(
                joinedload(BookingPassenger.passenger).joinedload(
                    Passenger.citizenship),
            )
            .filter(BookingPassenger.booking_id.in_(booking_ids))
        ):
            passengers_map[bp.booking_id].append(bp)

        for bf in (
            db.session.query(BookingFlight)
            .options(
                joinedload(BookingFlight.flight)
                .joinedload(Flight.route)
                .joinedload(Route.origin_airport),
                joinedload(BookingFlight.flight)
                .joinedload(Flight.route)
                .joinedload(Route.destination_airport),
                joinedload(BookingFlight.flight).joinedload(Flight.airline),
                joinedload(BookingFlight.tariff),
            )
            .filter(BookingFlight.booking_id.in_(booking_ids))
        ):
            flights_map[bf.booking_id].append(bf)

        for payment in (
            db.session.query(Payment)
            .filter(Payment.booking_id.in_(booking_ids))
        ):
            payments_map[payment.booking_id].append(payment)

    status_counts: dict[str, int] = defaultdict(int)
    issue_counts: dict[str, int] = defaultdict(int)
    routes_index: dict[int, dict] = {}
    flights_index: dict[int, dict] = {}

    items = []

    for booking in bookings:
        passengers = [
            _format_passenger(bp, bp.passenger)
            for bp in passengers_map.get(booking.id, [])
            if bp.passenger
        ]

        flights = []
        for bf in flights_map.get(booking.id, []):
            if bf.flight:
                formatted = _format_flight(bf, bf.flight)
                flights.append(formatted)
                route = formatted.get('route') or {}
                route_id_value = route.get('id')
                if route_id_value and route_id_value not in routes_index:
                    routes_index[route_id_value] = route
                flight_id_value = formatted.get('id')
                if flight_id_value and flight_id_value not in flights_index:
                    flights_index[flight_id_value] = {
                        'id': flight_id_value,
                        'number': formatted.get('number'),
                        'route_id': route_id_value,
                        'departure': formatted.get('scheduled_departure'),
                        'departure_time': formatted.get('scheduled_departure_time'),
                        'airline': formatted.get('airline'),
                    }

        booking_payments = payments_map.get(booking.id, [])
        payments = [_format_payment(payment) for payment in booking_payments]

        status = booking.status.value if booking.status else None
        status_counts[status] += 1

        issues = _calculate_booking_issues(booking, booking_payments)

        for key, value in issues.items():
            if value:
                issue_counts[key] += 1

        items.append(
            {
                'id': booking.id,
                'public_id': str(booking.public_id) if booking.public_id else None,
                'booking_number': booking.booking_number,
                'booking_date': booking.created_at.isoformat() if booking.created_at else None,
                'status': status,
                'status_history': booking.status_history or [],
                'buyer': {
                    'first_name': booking.buyer_first_name,
                    'last_name': booking.buyer_last_name,
                    'email': booking.email_address,
                    'phone': booking.phone_number,
                },
                'pricing': {
                    'currency': booking.currency.value if booking.currency else None,
                    'fare_price': booking.fare_price,
                    'fees': booking.fees,
                    'total_discounts': booking.total_discounts,
                    'total_price': booking.total_price,
                },
                'seats_number': booking.seats_number,
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
                'passengers': passengers,
                'flights': flights,
                'payments': payments,
                'issues': issues,
            }
        )

    response = {
        'items': items,
        'summary': {
            'total': len(items),
            'status_counts': dict(status_counts),
            'issue_counts': dict(issue_counts),
        },
        'filters': {
            'routes': sorted(routes_index.values(), key=lambda r: r.get('label', '')),
            'flights': sorted(flights_index.values(), key=lambda f: (f.get('route_id') or 0, f.get('departure') or '')),
        },
    }

    return jsonify(response), 200
