import pytest
from app.models.country import Country


@pytest.fixture
def country_ru():
    """Create and return Russia country"""
    return Country.create(
        name='Russia',
        name_en='Russia',
        code_a2='RU',
        code_a3='RUS'
    )
