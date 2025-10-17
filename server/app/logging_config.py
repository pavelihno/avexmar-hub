import os
import copy
import json
import logging
import traceback

from logging.config import dictConfig
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict


APP_LOG_DIR = Path(os.getenv('APP_LOG_DIR'))

_configured = False


class ISOFormatter(logging.Formatter):
    """Formatter that renders timestamps in ISO-8601 with millisecond precision"""

    def formatTime(self, record: logging.LogRecord, datefmt: str | None = None) -> str:
        dt = datetime.fromtimestamp(record.created, tz=timezone.utc)
        if datefmt:
            return dt.strftime(datefmt)
        return dt.isoformat(timespec='milliseconds')


class JSONFormatter(ISOFormatter):
    """Formatter that renders log records as structured JSON"""

    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            'timestamp': self.formatTime(record, None),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }

        if record.exc_info:
            stack = ''.join(traceback.format_exception(*record.exc_info))
            payload['stack'] = stack

        if record.stack_info:
            payload['stack'] = payload.get('stack', '') + record.stack_info

        extras: Dict[str, Any] = {}
        for key, value in record.__dict__.items():
            if key in {
                'name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                'thread', 'threadName', 'processName', 'process', 'message',
                'asctime',
            }:
                continue
            if value is None:
                continue
            if isinstance(value, (str, int, float, bool)):
                extras[key] = value
            else:
                extras[key] = str(value)

        if extras:
            payload['extra'] = extras

        return json.dumps(payload, ensure_ascii=True)


class MaxLevelFilter(logging.Filter):
    """Filter records above the configured maximum level"""

    def __init__(self, max_level: int | str) -> None:
        super().__init__()
        if isinstance(max_level, str):
            resolved = logging.getLevelName(max_level.upper())
            self.max_level = resolved if isinstance(
                resolved, int) else logging.WARNING
        else:
            self.max_level = max_level

    def filter(self, record: logging.LogRecord) -> bool:
        return record.levelno <= self.max_level


_BASE_LOGGING_CONFIG: Dict[str, Any] = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'below_error': {
            '()': 'app.logging_config.MaxLevelFilter',
            'max_level': 'WARNING',
        },
    },
    'formatters': {
        'standard': {
            '()': 'app.logging_config.ISOFormatter',
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s',
        },
        'access': {
            '()': 'app.logging_config.ISOFormatter',
            'format': '%(asctime)s %(message)s',
        },
        'json': {
            '()': 'app.logging_config.JSONFormatter',
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
        'app_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'application.log',
            'level': 'INFO',
            'formatter': 'json',
            'maxBytes': 10 * 1024 * 1024,
            'backupCount': 2,
            'encoding': 'utf-8',
            'delay': True,
            'filters': ['below_error'],
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'errors.log',
            'level': 'ERROR',
            'formatter': 'json',
            'maxBytes': 10 * 1024 * 1024,
            'backupCount': 2,
            'encoding': 'utf-8',
            'delay': True,
        },
    },
    'loggers': {
        'gunicorn.error': {
            'handlers': ['stderr', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'gunicorn.access': {
            'handlers': ['access'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['stdout', 'app_file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery.app.trace': {
            'handlers': ['stdout', 'app_file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['stdout', 'app_file', 'error_file'],
        'level': 'INFO',
    },
}


def build_logging_config() -> Dict[str, Any]:
    """Return a logging config dictionary with resolved file destinations"""

    config = copy.deepcopy(_BASE_LOGGING_CONFIG)
    app_log_path = APP_LOG_DIR / config['handlers']['app_file']['filename']
    error_log_path = APP_LOG_DIR / config['handlers']['error_file']['filename']

    config['handlers']['app_file']['filename'] = str(app_log_path)
    config['handlers']['error_file']['filename'] = str(error_log_path)

    return config


def configure_logging(force: bool = False) -> None:
    """Apply the shared logging configuration exactly once per process"""

    global _configured
    root_logger = logging.getLogger()

    if not force and _configured:
        return

    if not force and root_logger.handlers:
        # Assume another framework (e.g. Gunicorn) has already installed handlers.
        _configured = True
        return

    config = build_logging_config()

    dictConfig(config)
    logging.captureWarnings(True)
    _configured = True
