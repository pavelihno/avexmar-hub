import os
import sys
import pytest
from pathlib import Path
from dotenv import load_dotenv

from app.database import db
from app.config import Config
from app.app import __create_app

from tests.fixtures import *

# Load base and test environment variables
ROOT_DIR = Path(__file__).resolve().parents[2]
# Load environment variables from root directory
load_dotenv(f'{ROOT_DIR}/.env')
load_dotenv(Path(__file__).with_name('test.env'), override=True)

# Add server directory to Python path so `app` package can be imported
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class TestConfig(Config):
    TESTING = True

    SQLALCHEMY_DATABASE_URI = os.environ.get('SERVER_TEST_DATABASE_URI')


@pytest.fixture
def app():
    app = __create_app(TestConfig, db)

    with app.app_context():

        # Clean existing tables
        db.drop_all()

        # Create new tables
        db.create_all()

        yield app

        # Clean up after tests
        db.session.remove()
        # db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()
