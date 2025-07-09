import pytest
from datetime import datetime, timedelta
from app.models.discount import Discount
from app.config import Config


@pytest.fixture
def child_discount():
    """Create and return a child discount"""
    return Discount.create(
        discount_name="Child Discount",
        discount_type=Config.DISCOUNT_TYPE.child,
        percentage_value=25.0
    )


@pytest.fixture
def round_trip_discount():
    """Create and return a round trip discount"""
    return Discount.create(
        discount_name="Round Trip Discount",
        discount_type=Config.DISCOUNT_TYPE.round_trip,
        percentage_value=15.0
    )


@pytest.fixture
def infant_discount():
    """Create and return an infant discount"""
    return Discount.create(
        discount_name="Infant Discount",
        discount_type=Config.DISCOUNT_TYPE.infant,
        percentage_value=100.0
    )
