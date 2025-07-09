import pytest
from app.models.tariff import Tariff
from app.config import Config


@pytest.fixture
def economy_tariff(future_flight):
    """Create and return an economy tariff"""
    return Tariff.create(
        flight_id=future_flight.id,
        seat_class=Config.SEAT_CLASS.economy,
        price=15000.0,
        seats_number=180,
        currency=Config.CURRENCY.rub
    )


@pytest.fixture
def business_tariff(future_flight):
    """Create and return a business tariff"""
    return Tariff.create(
        flight_id=future_flight.id,
        seat_class=Config.SEAT_CLASS.business,
        price=45000.0,
        seats_number=20,
        currency=Config.CURRENCY.rub
    )
