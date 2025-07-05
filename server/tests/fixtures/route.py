import pytest
from app.models.route import Route


@pytest.fixture
def route_moscow_pevek(airport_moscow, airport_pevek):
    """Create and return a Moscow-Pevek route"""
    return Route.create(
        flight_number='SU1234',
        origin_airport_id=airport_moscow.id,
        destination_airport_id=airport_pevek.id
    )


@pytest.fixture
def route_pevek_moscow(airport_pevek, airport_moscow):
    """Create and return a Pevek-Moscow route"""
    return Route.create(
        flight_number='SU1235',
        origin_airport_id=airport_pevek.id,
        destination_airport_id=airport_moscow.id
    )
