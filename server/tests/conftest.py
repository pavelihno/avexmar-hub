import os
import sys
from pathlib import Path

import pytest
from dotenv import load_dotenv

# Add server directory to Python path so `app` package can be imported
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

test_db_uri = os.environ.get('SERVER_TEST_DATABASE_URI')
os.environ.setdefault('SERVER_DATABASE_URI', test_db_uri)

from app.app import __create_app
from app.config import Config
from app.database import db

# Load environment variables
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(f'{ROOT_DIR}/.env')


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('SERVER_TEST_DATABASE_URI')


@pytest.fixture
def app():
    app = __create_app(TestConfig, db)
    with app.app_context():
        # Create new tables
        db.create_all()
        yield app
        # Clean up after tests
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()
