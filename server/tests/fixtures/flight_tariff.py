import pytest
from app.models.flight_tariff import FlightTariff


@pytest.fixture
def economy_flight_tariff(future_flight, economy_tariff):
    return FlightTariff.create(
        flight_id=future_flight.id,
        tariff_id=economy_tariff.id,
        seats_number=100
    )

@pytest.fixture
def business_flight_tariff(future_flight, business_tariff):
    return FlightTariff.create(
        flight_id=future_flight.id,
        tariff_id=business_tariff.id,
        seats_number=10
    )


@pytest.fixture
def economy_return_flight_tariff(return_flight, economy_tariff):
    return FlightTariff.create(
        flight_id=return_flight.id,
        tariff_id=economy_tariff.id,
        seats_number=100
    )
