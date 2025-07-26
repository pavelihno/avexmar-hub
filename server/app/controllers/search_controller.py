from flask import jsonify, request
from sqlalchemy.orm import aliased

from app.database import db
from app.models.route import Route
from app.models.flight_tariff import FlightTariff
from app.models.tariff import Tariff

from app.models.airport import Airport
from app.models.flight import Flight


def search_airports():
    airports = Airport.get_all()
    return jsonify([airport.to_dict() for airport in airports])


def _query_flights(origin_code, dest_code, date_str, seat_class=None):
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
    if date_str:
        query = query.filter(Flight.scheduled_departure == date_str)

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
                min_tariff = min((t for _, t in tariffs), key=lambda x: x.price)
                f_dict['min_price'] = min_tariff.price
                f_dict['currency'] = min_tariff.currency.value
        results.append(f_dict)
    return results


def search_flights():
    params = request.args
    origin_code = params.get('from')
    dest_code = params.get('to')
    depart_date = params.get('when')
    return_date = params.get('return')
    seat_class = params.get('class')

    flights = _query_flights(origin_code, dest_code, depart_date, seat_class)
    if return_date:
        flights += _query_flights(dest_code, origin_code, return_date, seat_class)
    return jsonify(flights)
