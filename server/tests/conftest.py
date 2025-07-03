from pathlib import Path
import sys
import pytest
from dotenv import load_dotenv

# Load base and test environment variables
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".example.env")
load_dotenv(Path(__file__).with_name("test.env"), override=True)

# Add server directory to Python path so `app` package can be imported
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.app import __create_app
from app.config import Config
from app.database import db


class TestConfig(Config):
    TESTING = True


@pytest.fixture

def app():
    app = __create_app(TestConfig, db)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture

def client(app):
    return app.test_client()
