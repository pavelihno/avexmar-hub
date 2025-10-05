from app.logging_config import build_logging_config, configure_logging

bind = '0.0.0.0:8000'
timeout = 600
accesslog = '-'
errorlog = '-'
logconfig_dict = build_logging_config()


def on_starting(server):
    """Ensure logging is configured before workers fork"""
    configure_logging(force=True)
