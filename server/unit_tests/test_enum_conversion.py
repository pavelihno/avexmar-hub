import os
import sys
import pytest
from flask import Flask

# Ensure app package importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import db
from app.models.fee import Fee
from app.utils.enum import FEE_APPLICATION, FEE_TERM


class _TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


@pytest.fixture
def app():
    app = Flask(__name__)
    app.config.from_object(_TestConfig)
    db.init_app(app)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def test_fee_enum_conversion_create(app):
    fee = Fee.create(name='service', amount=10, application='booking', application_term='none', commit=True)
    assert isinstance(fee.application, FEE_APPLICATION)
    assert fee.application == FEE_APPLICATION.booking
    assert isinstance(fee.application_term, FEE_TERM)
    assert fee.application_term == FEE_TERM.none


def test_fee_enum_conversion_update(app):
    fee = Fee.create(name='service', amount=10, application='booking', application_term='none', commit=True)
    fee = Fee.update(fee.id, application='cancellation', application_term='after_departure', commit=True)
    assert fee.application == FEE_APPLICATION.cancellation
    assert fee.application_term == FEE_TERM.after_departure


def test_fee_invalid_enum(app):
    fee = Fee.create(name='bad', amount=5, application='invalid', application_term='none', commit=True)
    assert fee.application == FEE_APPLICATION.booking
