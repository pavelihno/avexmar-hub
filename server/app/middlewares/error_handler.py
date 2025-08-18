from functools import wraps
from typing import Callable, Any

from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException

from app.models._base_model import ModelValidationError, NotFoundError
from app.database import db


def handle_exceptions(f: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator to handle common exceptions and return JSON responses."""

    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ModelValidationError as e:
            return jsonify({'errors': e.errors}), 400
        except NotFoundError as e:
            return jsonify({'message': str(e)}), 404
        except Exception as e:  # unexpected errors
            if isinstance(e, HTTPException):
                # Let Flask handle built-in HTTP exceptions
                raise e
            if current_app:
                current_app.logger.exception("Unhandled exception", exc_info=e)
            return jsonify({'message': 'Internal server error'}), 500

    return wrapper


def register_error_handlers(app):
    """Register global error handlers on the given Flask app."""

    @app.errorhandler(ModelValidationError)
    def _handle_model_validation_error(e):
        db.session.rollback()
        return jsonify({'errors': e.errors}), 400

    @app.errorhandler(NotFoundError)
    def _handle_not_found_error(e):
        db.session.rollback()
        return jsonify({'message': str(e)}), 404

    @app.errorhandler(Exception)
    def _handle_unexpected_error(e):
        if isinstance(e, HTTPException):
            return e
        db.session.rollback()
        app.logger.exception("Unhandled exception", exc_info=e)
        return jsonify({'message': 'Internal server error'}), 500

