from __future__ import annotations

import logging
from logging.config import dictConfig
from datetime import datetime, timezone
from typing import Any, Dict


class ISOFormatter(logging.Formatter):
    """Formatter that renders timestamps in ISO-8601 with millisecond precision."""

    def formatTime(self, record: logging.LogRecord, datefmt: str | None = None) -> str:
        dt = datetime.fromtimestamp(record.created, tz=timezone.utc)
        if datefmt:
            return dt.strftime(datefmt)
        return dt.isoformat(timespec='milliseconds')


LOGGING_CONFIG: Dict[str, Any] = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            '()': 'app.logging_config.ISOFormatter',
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s',
        },
        'access': {
            '()': 'app.logging_config.ISOFormatter',
            'format': '%(asctime)s %(message)s',
        },
    },
    'handlers': {
        'stdout': {
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stdout',
            'level': 'INFO',
            'formatter': 'standard',
        },
        'stderr': {
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stderr',
            'level': 'INFO',
            'formatter': 'standard',
        },
        'access': {
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stdout',
            'level': 'INFO',
            'formatter': 'access',
        },
    },
    'loggers': {
        'gunicorn.error': {
            'handlers': ['stderr'],
            'level': 'INFO',
            'propagate': False,
        },
        'gunicorn.access': {
            'handlers': ['access'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['stdout'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery.app.trace': {
            'handlers': ['stdout'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['stdout'],
        'level': 'INFO',
    },
}


_configured = False


def configure_logging(force: bool = False) -> None:
    """Apply the shared logging configuration exactly once per process."""

    global _configured
    root_logger = logging.getLogger()

    if not force and _configured:
        return

    if not force and root_logger.handlers:
        # Assume another framework (e.g. Gunicorn) has already installed handlers.
        _configured = True
        return

    dictConfig(LOGGING_CONFIG)
    logging.captureWarnings(True)
    _configured = True
