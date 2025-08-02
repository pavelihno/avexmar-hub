from flask import jsonify, request
from sqlalchemy.orm import aliased

from app.database import db
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


def __query_flights(origin_code, dest_code, date_from=None, date_to=None, is_exact=True, seat_class=None, direction=None):
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

    if is_exact:
        if date_from:
            query = query.filter(Flight.scheduled_departure == date_from)
        else:
            query = query.filter(True == False) # No date provided, return no results
    else:
        if date_from and date_to:
            query = query.filter(
                Flight.scheduled_departure.between(date_from, date_to)
            )
        elif date_from:
            query = query.filter(Flight.scheduled_departure >= date_from)
        else:
            query = query.filter(True == False) # No date provided, return no results

    flights = query.all()
    results = []
    for flight in flights:
        f_dict = flight.to_dict()
        tariff_query = (
            db.session.query(FlightTariff, Tariff)
            .join(Tariff, FlightTariff.tariff_id == Tariff.id)
            .filter(FlightTariff.flight_id == flight.id)
        )
        if seat_class:
            tariff_query = tariff_query.filter(Tariff.seat_class == seat_class)
        tariffs = tariff_query.all()
        if tariffs:
            if seat_class:
                _, t = tariffs[0]
                f_dict['price'] = t.price
                f_dict['currency'] = t.currency.value
            else:
                min_tariff = min(
                    (t for _, t in tariffs),
                    key=lambda x: x.price
                )
                f_dict['min_price'] = min_tariff.price
                f_dict['currency'] = min_tariff.currency.value
        if direction:
            f_dict['direction'] = direction
        results.append(f_dict)
    return results


def search_flights():
    params = request.args

    origin_code = params.get('from')
    dest_code = params.get('to')
    is_exact = params.get('date_mode') == 'exact'
    seat_class = params.get('class')
    passengers_num = int(params.get('adults', 0)) + int(params.get('children', 0)) + int(params.get('infants', 0))

    depart_from = params.get('when') if is_exact else params.get('when_from')
    depart_to = None if is_exact else params.get('when_to')

    return_from = params.get('return') if is_exact else params.get('return_from')
    return_to = None if is_exact else params.get('return_to')

    flights = []

    flights += __query_flights(
        origin_code=origin_code, dest_code=dest_code,
        date_from=depart_from, date_to=depart_to,
        is_exact=is_exact, seat_class=seat_class,
        direction='outbound'
    )

    flights += __query_flights(
        origin_code=dest_code, dest_code=origin_code,
        date_from=return_from, date_to=return_to,
        is_exact=is_exact, seat_class=seat_class,
        direction='return'
    )

    return jsonify(flights)


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
