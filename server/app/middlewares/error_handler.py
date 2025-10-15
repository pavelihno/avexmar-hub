import logging

from flask import current_app, jsonify
from werkzeug.exceptions import HTTPException, NotFound

from app.constants.messages import ErrorMessages
from app.database import db
from app.models._base_model import ModelValidationError, NotFoundError
from app.utils.email import EmailError


logger = logging.getLogger(__name__)


def _get_logger():
    try:
        return current_app.logger
    except Exception:
        return logger


def _log_exception(message: str, *, level: str = 'error') -> None:
    log = _get_logger()
    log_fn = getattr(log, level, log.error)
    log_fn(message, exc_info=True)


def register_error_handlers(app):
    """Register global error handlers on the given Flask app"""

    @app.errorhandler(ModelValidationError)
    def _handle_model_validation_error(e):
        db.session.rollback()
        _log_exception(f'Model validation error: {e}', level='warning')
        return jsonify({'errors': e.errors}), 400

    @app.errorhandler(NotFoundError)
    @app.errorhandler(NotFound)
    def _handle_not_found_error(e):
        db.session.rollback()
        _log_exception(f'Resource not found: {e}', level='warning')
        return jsonify({'message': str(e)}), 404

    @app.errorhandler(EmailError)
    def _handle_email_error(e):
        db.session.rollback()
        _log_exception(f'Email error: {e}')
        return jsonify({'message': ErrorMessages.FAILED_TO_SEND_EMAIL}), 500

    @app.errorhandler(ValueError)
    def _handle_value_error(e):
        db.session.rollback()
        _log_exception(f'Invalid request data: {e}', level='warning')
        return jsonify({'message': str(e)}), 400

    @app.errorhandler(TypeError)
    def _handle_type_error(e):
        db.session.rollback()
        _log_exception(f'Invalid request type: {e}', level='warning')
        return jsonify({'message': str(e)}), 400

    @app.errorhandler(Exception)
    def _handle_unexpected_error(e):
        if isinstance(e, HTTPException):
            _log_exception(f'HTTP exception: {e}', level='warning')
            return e
        db.session.rollback()
        _log_exception(f'Unhandled exception: {e}')
        return jsonify({'message': ErrorMessages.INTERNAL_SERVER_ERROR}), 500
