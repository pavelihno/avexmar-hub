import pytest
from app.models.seat import Seat


@pytest.fixture
def economy_seat(future_flight, economy_tariff, adult_passenger, economy_booking):
    """Create and return an economy seat"""
    return Seat.create(
        seat_number='15A',
        flight_id=future_flight.id,
        tariff_id=economy_tariff.id,
        passenger_id=adult_passenger.id,
        booking_id=economy_booking.id
    )


@pytest.fixture
def business_seat(future_flight, business_tariff, adult_passenger, business_booking):
    """Create and return a business seat"""
    return Seat.create(
        seat_number='2C',
        flight_id=future_flight.id,
        tariff_id=business_tariff.id,
        passenger_id=adult_passenger.id,
        booking_id=business_booking.id
    )


@pytest.fixture
def available_seat(future_flight, economy_tariff):
    """Create and return an available seat (not booked)"""
    return Seat.create(
        seat_number='20F',
        flight_id=future_flight.id,
        tariff_id=economy_tariff.id,
        passenger_id=None,
        booking_id=None
    )
