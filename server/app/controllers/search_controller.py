from flask import jsonify, request
from sqlalchemy.orm import aliased

from app.database import db
from app.models.airline import Airline
from app.models.route import Route
from app.models.flight_tariff import FlightTariff
from app.models.tariff import Tariff

from sqlalchemy import or_
from app.models.airport import Airport
from app.models.flight import Flight


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
    return jsonify([airport.to_dict() for airport in airports])


def __get_available_tariffs(flight_id):
    tariff_query = (
        db.session.query(FlightTariff, Tariff)
        .join(Tariff, FlightTariff.tariff_id == Tariff.id)
        .filter(FlightTariff.flight_id == flight_id)
    )
    return [
        {
            'id': t.id,
            'seat_class': t.seat_class.value,
            'title': t.title,
            'price': t.price,
            'currency': t.currency.value,
            'conditions': t.conditions,
            'seats_left': ft.seats_number,
        }
        for ft, t in tariff_query
        if (ft.seats_number is None or ft.seats_number > 0) and t.price is not None
    ]


def __query_flights(
    origin_code,
    dest_code,
    date_from=None,
    date_to=None,
    airline_iata_code=None,
    flight_number=None,
    is_exact=True,
    seat_class=None,
    seats_number=0,
    direction=None,
):
    origin = aliased(Airport)
    dest = aliased(Airport)

    query = (
        db.session.query(Flight)
        .join(Route, Flight.route_id == Route.id)
        .join(origin, Route.origin_airport_id == origin.id)
        .join(dest, Route.destination_airport_id == dest.id)
    )

    if origin_code:
        query = query.filter(origin.iata_code == origin_code)
    if dest_code:
        query = query.filter(dest.iata_code == dest_code)
    if airline_iata_code and flight_number:
        query = query.join(Airline, Flight.airline_id == Airline.id)
        query = query.filter(
            Airline.iata_code == airline_iata_code, Flight.flight_number == flight_number
        )

    if is_exact:
        if date_from:
            query = query.filter(Flight.scheduled_departure == date_from)
        else:
            # No date provided, return no results
            query = query.filter(True == False)
    else:
        if date_from and date_to:
            query = query.filter(
                Flight.scheduled_departure.between(date_from, date_to)
            )
        elif date_from:
            query = query.filter(Flight.scheduled_departure >= date_from)
        else:
            # No date provided, return no results
            query = query.filter(True == False)

    flights = query.all()
    results = []
    for flight in flights:
        f_dict = flight.to_dict()
        all_tariffs = __get_available_tariffs(flight.id)
        if not all_tariffs:
            continue

        matching_tariffs = all_tariffs
        if seat_class and seats_number > 0:
            matching_tariffs = [
                t
                for t in all_tariffs
                if t['seat_class'] == seat_class
                and (t['seats_left'] is None or t['seats_left'] >= seats_number)
            ]
            if not matching_tariffs:
                continue
            min_tariff = min(matching_tariffs, key=lambda x: x['price'])
            f_dict['price'] = min_tariff['price']
        else:
            min_tariff = min(all_tariffs, key=lambda x: x['price'])

        f_dict['min_price'] = min_tariff['price']
        f_dict['currency'] = min_tariff['currency']

        if direction:
            f_dict['direction'] = direction
        results.append(f_dict)
    return results


def search_flights(is_nearby=False):
    params = request.args

    origin_code = params.get('from')
    dest_code = params.get('to')
    is_exact = params.get('date_mode') == 'exact'
    seat_class = params.get('class')
    seats_number = int(params.get('adults', 0)) + int(params.get('children', 0)) + int(params.get('infants_seat', 0))

    depart_from = params.get('when') if is_exact else params.get('when_from')
    depart_to = None if is_exact else params.get('when_to')

    return_from = params.get('return') if is_exact else params.get('return_from')
    return_to = None if is_exact else params.get('return_to')

    outbound_airline_iata_code = params.get('outbound_airline')
    outbound_flight_number = params.get('outbound_flight')

    return_airline_iata_code = params.get('return_airline')
    return_flight_number = params.get('return_flight')

    outbound_flights = __query_flights(
        origin_code=origin_code, dest_code=dest_code,
        date_from=depart_from, date_to=depart_to,
        is_exact=is_exact, seat_class=seat_class,
        airline_iata_code=outbound_airline_iata_code, flight_number=outbound_flight_number,
        direction='outbound'
    )

    has_return = return_from is not None

    return_flights = __query_flights(
        origin_code=dest_code, dest_code=origin_code,
        date_from=return_from, date_to=return_to,
        is_exact=is_exact, seat_class=seat_class,
        airline_iata_code=return_airline_iata_code, flight_number=return_flight_number,
        direction='return'
    ) if has_return else []

    is_outbound_found = bool(outbound_flights)
    is_return_found = bool(return_flights)

    if not is_nearby:
        if not is_outbound_found:
            return jsonify([])
        elif has_return and not is_return_found:
            return jsonify([])

    return jsonify(outbound_flights + return_flights)

def search_nearby_flights():
    return search_flights(is_nearby=True)


def search_flight_tariffs(flight_id):
    tariffs = __get_available_tariffs(flight_id)
    return jsonify(sorted(tariffs, key=lambda x: x['price']))


def schedule_flights():
    params = request.args

    origin_code = params.get('from')
    dest_code = params.get('to')
    depart_date = params.get('when')

    flights = []

    flights += __query_flights(
        origin_code=origin_code, dest_code=dest_code,
        date_from=depart_date,
        is_exact=False,
        direction='outbound'
    )
    flights += __query_flights(
        origin_code=dest_code, dest_code=origin_code,
        date_from=depart_date,
        is_exact=False,
        direction='return'
    )

    return jsonify(flights)
