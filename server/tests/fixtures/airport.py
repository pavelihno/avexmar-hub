import pytest
from app.models.airport import Airport


@pytest.fixture
def airport_moscow():
    """Create and return a Moscow airport"""
    return Airport.create(
        iata_code='SVO',
        icao_code='UUEE',
        name='Sheremetyevo International Airport',
        city_code='MOW',
        country_code='RU'
    )


@pytest.fixture
def airport_saint_petersburg():
    """Create and return a Saint Petersburg airport"""
    return Airport.create(
        iata_code='LED',
        icao_code='ULLI',
        name='Pulkovo Airport',
        city_code='LED',
        country_code='RU'
    )


@pytest.fixture
def airport_pevek():
    """Create and return a Pevek airport"""
    return Airport.create(
        iata_code='PWE',
        icao_code='UHMP',
        name='Pevek Airport',
        city_code='PWE',
        country_code='RU'
    )
