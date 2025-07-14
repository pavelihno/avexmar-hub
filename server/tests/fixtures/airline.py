import pytest
from app.models.airline import Airline


@pytest.fixture
def su_airline(country_ru):
    """Create and return Aeroflot airline"""
    return Airline.create(
        iata_code='SU',
        icao_code='AFL',
        name='Aeroflot',
        country_id=country_ru.id
    )


@pytest.fixture
def s7_airline(country_ru):
    """Create and return S7 airline"""
    return Airline.create(
        iata_code='S7',
        icao_code='SBI',
        name='S7 Airlines',
        country_id=country_ru.id
    )
