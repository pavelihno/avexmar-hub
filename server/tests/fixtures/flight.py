import pytest
from datetime import datetime, timedelta
from app.models.flight import Flight


@pytest.fixture
def future_flight(route_moscow_pevek):
    """Create and return a future flight"""
    departure = datetime.now() + timedelta(days=7)
    arrival = departure + timedelta(hours=4)
    return Flight.create(
        route_id=route_moscow_pevek.id,
        scheduled_departure=departure,
        scheduled_arrival=arrival,
        status='scheduled'
    )


@pytest.fixture
def past_flight(route_pevek_moscow):
    """Create and return a past flight"""
    departure = datetime.now() - timedelta(days=7)
    arrival = departure + timedelta(hours=4)
    return Flight.create(
        route_id=route_pevek_moscow.id,
        scheduled_departure=departure,
        scheduled_arrival=arrival,
        status='arrived'
    )


@pytest.fixture
def cancelled_flight(route_moscow_pevek):
    """Create and return a cancelled flight"""
    departure = datetime.now() + timedelta(days=3)
    arrival = departure + timedelta(hours=4)
    return Flight.create(
        route_id=route_moscow_pevek.id,
        scheduled_departure=departure,
        scheduled_arrival=arrival,
        status='cancelled'
    )
