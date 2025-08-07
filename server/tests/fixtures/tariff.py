import pytest
from app.models.tariff import Tariff
from app.config import Config


@pytest.fixture
def economy_tariff():
    """Create and return an economy tariff"""
    return Tariff.create(
        seat_class=Config.SEAT_CLASS.economy,
        title='Economy',
        price=15000.0,
        currency=Config.CURRENCY.rub
    )


@pytest.fixture
def business_tariff():
    """Create and return a business tariff"""
    return Tariff.create(
        seat_class=Config.SEAT_CLASS.business,
        title='Business',
        price=45000.0,
        currency=Config.CURRENCY.rub
    )
