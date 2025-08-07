import pytest
from app.models.airport import Airport


import pytest
from app.models.airport import Airport


@pytest.fixture
def airport_moscow(tz_moscow, country_ru):
    """Create and return a Moscow airport"""
    return Airport.create(
        iata_code='SVO',
        icao_code='UUEE',
        name='Sheremetyevo International Airport',
        city_name='Moscow',
        city_code='MOW',
        country_id=country_ru.id,
        timezone_id=tz_moscow.id,
    )


@pytest.fixture
def airport_saint_petersburg(tz_moscow, country_ru):
    """Create and return a Saint Petersburg airport"""
    return Airport.create(
        iata_code='LED',
        icao_code='ULLI',
        name='Pulkovo Airport',
        city_name='Saint Petersburg',
        city_code='LED',
        country_id=country_ru.id,
        timezone_id=tz_moscow.id,
    )


@pytest.fixture
def airport_pevek(tz_anadyr, country_ru):
    """Create and return a Pevek airport"""
    return Airport.create(
        iata_code='PWE',
        icao_code='UHMP',
        name='Pevek Airport',
        city_name='Pevek',
        city_code='PWE',
        country_id=country_ru.id,
        timezone_id=tz_anadyr.id,
    )
