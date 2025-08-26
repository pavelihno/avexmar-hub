import os
import sys
import types
from pathlib import Path

import pytest
from dotenv import load_dotenv

# Add server directory to Python path so `app` package can be imported
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Provide stub for flask_limiter if package is unavailable
if 'flask_limiter' not in sys.modules:
    limiter_stub = types.ModuleType('flask_limiter')
    util_stub = types.ModuleType('flask_limiter.util')

    class Limiter:
        def __init__(self, *args, **kwargs):
            pass

        def limit(self, *args, **kwargs):
            def decorator(f):
                return f

            return decorator

        def init_app(self, app):
            pass

    def get_remote_address():
        return None

    limiter_stub.Limiter = Limiter
    util_stub.get_remote_address = get_remote_address
    sys.modules['flask_limiter'] = limiter_stub
    sys.modules['flask_limiter.util'] = util_stub

if 'pyotp' not in sys.modules:
    pyotp_stub = types.ModuleType('pyotp')

    def random_base32():
        return 'BASE32SECRET'

    class TOTP:
        def __init__(self, *args, **kwargs):
            pass

        def now(self):
            return '123456'

        def verify(self, _):
            return False

    pyotp_stub.random_base32 = random_base32
    pyotp_stub.TOTP = TOTP
    sys.modules['pyotp'] = pyotp_stub

try:
    import sqlalchemy.dialects.postgresql as pg
    from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON, TEXT as SQLITE_TEXT

    pg.JSONB = SQLITE_JSON
    pg.INET = SQLITE_TEXT
except Exception:  # pragma: no cover
    pass

test_db_uri = os.environ.get('SERVER_TEST_DATABASE_URI')
os.environ.setdefault('SERVER_DATABASE_URI', test_db_uri)

from app.app import __create_app
from app.config import Config
from app.database import db

Config.SECRET_KEY = 'test'
Config.CORS_ORIGINS = ['*']

# Load environment variables
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(f'{ROOT_DIR}/.env')


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('SERVER_TEST_DATABASE_URI')
    SECRET_KEY = 'test'


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
