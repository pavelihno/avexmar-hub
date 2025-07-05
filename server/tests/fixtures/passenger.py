import pytest
from datetime import date
from app.models.passenger import Passenger


@pytest.fixture
def adult_passenger():
    """Create and return an adult passenger"""
    return Passenger.create(
        full_name='Ivan Ivanov',
        document_number='1234567890',
        birth_date=date(1990, 1, 15),
        gender='М',
        is_infant=False
    )


@pytest.fixture
def child_passenger():
    """Create and return a child passenger"""
    return Passenger.create(
        full_name='Maria Ivanova',
        document_number='0987654321',
        birth_date=date(2018, 5, 10),
        gender='Ж',
        is_infant=False
    )


@pytest.fixture
def infant_passenger():
    """Create and return an infant passenger"""
    return Passenger.create(
        full_name='Alexey Ivanov',
        document_number='1122334455',
        birth_date=date(2023, 8, 20),
        gender='М',
        is_infant=True
    )
