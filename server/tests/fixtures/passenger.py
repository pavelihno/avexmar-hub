import pytest
from datetime import date
from app.models.passenger import Passenger
from app.config import Config


@pytest.fixture
def adult_passenger():
    """Create and return an adult passenger"""
    return Passenger.create(
        first_name='Ivan',
        last_name='Ivanov',
        document_type=Config.DOCUMENT_TYPE.PASSPORT,
        document_number='1234567890',
        birth_date=date(1990, 1, 15),
        gender=Config.GENDER.М
    )


@pytest.fixture
def child_passenger():
    """Create and return a child passenger"""
    return Passenger.create(
        first_name='Maria',
        last_name='Ivanova',
        document_type=Config.DOCUMENT_TYPE.BIRTH_CERTIFICATE,
        document_number='0987654321',
        birth_date=date(2018, 5, 10),
        gender=Config.GENDER.Ж
    )


@pytest.fixture
def infant_passenger():
    """Create and return an infant passenger"""
    return Passenger.create(
        first_name='Alexey',
        last_name='Ivanov',
        document_type=Config.DOCUMENT_TYPE.BIRTH_CERTIFICATE,
        document_number='1122334455',
        birth_date=date(2023, 8, 20),
        gender=Config.GENDER.М
    )
