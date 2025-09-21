from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.config import Config


limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=Config.LIMITER_STORAGE_URI,
    headers_enabled=True,
)


def init_limiter(app):
    limiter.init_app(app)
