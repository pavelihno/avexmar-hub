from app.logging_config import LOGGING_CONFIG, configure_logging

bind = '0.0.0.0:8000'
timeout = 600
accesslog = '-'
errorlog = '-'
logconfig_dict = LOGGING_CONFIG


def on_starting(server):
    """Ensure logging is configured before workers fork."""
    configure_logging(force=True)
