import pytest

from app.models.flight_tariff import FlightTariff
from app.models.tariff import Tariff
from app.models._base_model import ModelValidationError
from app.config import Config


def test_unique_class_on_create(future_flight, economy_tariff):
    ft1 = FlightTariff.create(
        flight_id=future_flight.id,
        tariff_id=economy_tariff.id,
        seats_number=100
    )
    assert ft1 is not None

    with pytest.raises(ModelValidationError):
        FlightTariff.create(
            flight_id=future_flight.id,
            tariff_id=economy_tariff.id,
            seats_number=50
        )

    another_tariff = Tariff.create(
        seat_class=Config.SEAT_CLASS.economy,
        price=16000.0,
        currency=Config.CURRENCY.rub
    )
    with pytest.raises(ModelValidationError):
        FlightTariff.create(
            flight_id=future_flight.id,
            tariff_id=another_tariff.id,
            seats_number=30
        )


def test_unique_class_on_update(future_flight, economy_tariff, business_tariff):
    ft1 = FlightTariff.create(
        flight_id=future_flight.id,
        tariff_id=economy_tariff.id,
        seats_number=100
    )
    ft2 = FlightTariff.create(
        flight_id=future_flight.id,
        tariff_id=business_tariff.id,
        seats_number=10
    )

    # updating same record without changing seat_class should pass
    updated = FlightTariff.update(ft1.id, seats_number=120)
    assert updated.seats_number == 120

    with pytest.raises(ModelValidationError):
        FlightTariff.update(ft2.id, tariff_id=economy_tariff.id)

