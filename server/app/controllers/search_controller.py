from flask import jsonify, request
from sqlalchemy import or_

from app.database import db
from app.models.airport import Airport
from app.models.route import Route
from app.utils.business_logic import get_seats_number, calculate_price_details
from app.utils.search import build_schedule, get_available_tariffs, query_flights


def search_airports():
    airports = (
        db.session.query(Airport)
        .join(
            Route,
            or_(
                Airport.id == Route.origin_airport_id,
                Airport.id == Route.destination_airport_id,
            ),
        )
        .distinct()
        .order_by(Airport.name.asc())
        .all()
    )
    return jsonify([airport.to_dict() for airport in airports]), 200


def search_flights(is_nearby=False):
    params = request.args

    origin_code = params.get('from')
    dest_code = params.get('to')
    is_exact = params.get('date_mode') == 'exact'
    seat_class = params.get('class')
    seats_number = get_seats_number(params)

    depart_from = params.get('when') if is_exact else params.get('when_from')
    depart_to = None if is_exact else params.get('when_to')

    return_from = params.get('return') if is_exact else params.get('return_from')
    return_to = None if is_exact else params.get('return_to')

    outbound_airline_iata_code = params.get('outbound_airline') if not is_nearby else None
    outbound_flight_number = params.get('outbound_flight') if not is_nearby else None

    return_airline_iata_code = params.get('return_airline') if not is_nearby else None
    return_flight_number = params.get('return_flight') if not is_nearby else None

    outbound_flights = query_flights(
        origin_code=origin_code,
        dest_code=dest_code,
        date_from=depart_from,
        date_to=depart_to,
        is_exact=is_exact,
        seat_class=seat_class,
        seats_number=seats_number,
        airline_iata_code=outbound_airline_iata_code,
        flight_number=outbound_flight_number,
        direction='outbound',
    )

    has_return = return_from is not None

    return_flights = (
        query_flights(
            origin_code=dest_code,
            dest_code=origin_code,
            date_from=return_from,
            date_to=return_to,
            is_exact=is_exact,
            seat_class=seat_class,
            seats_number=seats_number,
            airline_iata_code=return_airline_iata_code,
            flight_number=return_flight_number,
            direction='return',
        )
        if has_return
        else []
    )

    is_outbound_found = bool(outbound_flights)
    is_return_found = bool(return_flights)

    if not is_nearby:
        if not is_outbound_found:
            return jsonify([]), 200
        elif has_return and not is_return_found:
            return jsonify([]), 200

    return jsonify(outbound_flights + return_flights), 200


def search_nearby_flights():
    return search_flights(is_nearby=True)


def search_flight_tariffs(flight_id):
    tariffs = get_available_tariffs(flight_id)
    return jsonify(tariffs), 200


def schedule_flights():
    params = request.args

    origin_code = params.get('from')
    dest_code = params.get('to')
    depart_date = params.get('when')

    flights = build_schedule(origin_code, dest_code, depart_date)

    return jsonify(flights), 200


def calculate_price():
    data = request.json or {}
    outbound_id = data.get('outbound_id')
    return_id = data.get('return_id')
    outbound_tariff_id = data.get('outbound_tariff_id')
    return_tariff_id = data.get('return_tariff_id')
    passengers = data.get('passengers', {})

    result = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
        passengers,
    )
    return jsonify(result), 200
