import pytest
from app.models.seat import Seat


@pytest.fixture
def economy_seat(economy_tariff, economy_booking):
    """Create and return an economy seat"""
    return Seat.create(
        seat_number='15A',
        tariff_id=economy_tariff.id,
        booking_id=economy_booking.id
    )


@pytest.fixture
def business_seat(business_tariff, business_booking):
    """Create and return a business seat"""
    return Seat.create(
        seat_number='2C',
        tariff_id=business_tariff.id,
        booking_id=business_booking.id
    )


@pytest.fixture
def available_seat(economy_tariff):
    """Create and return an available seat (not booked)"""
    return Seat.create(
        seat_number='20F',
        tariff_id=economy_tariff.id,
        booking_id=None
    )
