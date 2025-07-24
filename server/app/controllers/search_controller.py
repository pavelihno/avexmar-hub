from flask import jsonify

from app.models.airport import Airport
from app.models.flight import Flight


def search_airports():
    airports = Airport.get_all()
    return jsonify([airport.to_dict() for airport in airports])


def search_flights():
    flights = Flight.get_all()
    return jsonify([flight.to_dict() for flight in flights])
