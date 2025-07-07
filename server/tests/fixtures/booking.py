import pytest
import uuid
from app.models.booking import Booking
from app.config import Config


@pytest.fixture
def economy_booking():
    """Create and return an economy class booking"""
    booking_number = f"BK{uuid.uuid4().hex[:8].upper()}"
    return Booking.create(
        booking_number=booking_number,
        status=Config.BOOKING_STATUS.confirmed,
        email_address='customer@example.com',
        phone_number='+7 999 123 45 67',
        first_name='Customer',
        last_name='Test',
        currency=Config.CURRENCY.rub,
        base_price=15000.0,
        final_price=15000.0
    )


@pytest.fixture
def business_booking():
    """Create and return a business class booking"""
    booking_number = f"BK{uuid.uuid4().hex[:8].upper()}"
    return Booking.create(
        booking_number=booking_number,
        status=Config.BOOKING_STATUS.confirmed,
        email_address='vip@example.com',
        phone_number='+7 999 987 65 43',
        first_name='VIP',
        last_name='Customer',
        currency=Config.CURRENCY.rub,
        base_price=45000.0,
        final_price=45000.0
    )
