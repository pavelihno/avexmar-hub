from http import HTTPStatus

from flask import jsonify
from redis import Redis
from redis.exceptions import RedisError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import Config
from app.database import db


def _check_database():
    try:
        with db.engine.connect() as connection:
            connection.execute(text('SELECT 1'))
        return True, None
    except SQLAlchemyError as exc:
        return False, str(exc)
    except Exception as exc:
        return False, str(exc)


def _check_redis():
    redis_url = Config.LIMITER_STORAGE_URI or Config.CELERY_BROKER_URL
    if not redis_url:
        return True, None

    client = Redis.from_url(redis_url)

    try:
        client.ping()
        return True, None
    except RedisError as exc:
        return False, str(exc)
    except Exception as exc:
        return False, str(exc)
    finally:
        client.close()


def health_live():
    return jsonify({'status': 'pass'}), HTTPStatus.OK


def health_ready():
    checks = {}
    overall_ok = True

    db_ok, db_error = _check_database()
    checks['database'] = {'status': 'pass' if db_ok else 'fail'}
    if db_error:
        checks['database']['error'] = db_error
    overall_ok &= db_ok

    redis_ok, redis_error = _check_redis()
    checks['redis'] = {'status': 'pass' if redis_ok else 'fail'}
    if redis_error:
        checks['redis']['error'] = redis_error
    overall_ok &= redis_ok

    return (
        jsonify({
            'status': 'pass' if overall_ok else 'fail',
            'checks': checks,
        }),
        HTTPStatus.OK if overall_ok else HTTPStatus.SERVICE_UNAVAILABLE
    )
