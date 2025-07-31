import pytest
from app.models.timezone import Timezone


@pytest.fixture
def tz_moscow():
    return Timezone.create(name='Europe/Moscow')


@pytest.fixture
def tz_anadyr():
    return Timezone.create(name='Asia/Anadyr')
