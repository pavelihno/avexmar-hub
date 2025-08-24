import os


class Config:

    APP_ENV = os.environ.get('SERVER_APP_ENV')

    CLIENT_URL = os.environ.get('SERVER_CLIENT_URL')

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    SECRET_KEY = os.environ.get('SERVER_SECRET_KEY')

    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('SERVER_DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security settings
    CSRF_ENABLED = True
    CORS_ORIGINS = CLIENT_URL

    # Mail settings
    MAIL_SERVER = os.environ.get('SERVER_MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('SERVER_MAIL_PORT', 25))
    MAIL_USE_TLS = os.environ.get('SERVER_MAIL_USE_TLS') == 'True'
    MAIL_USE_SSL = os.environ.get('SERVER_MAIL_USE_SSL') == 'True'
    MAIL_DEFAULT_USERNAME = os.environ.get('SERVER_MAIL_DEFAULT_USERNAME')
    MAIL_DEFAULT_PASSWORD = os.environ.get('SERVER_MAIL_DEFAULT_PASSWORD')
    MAIL_NOREPLY_USERNAME = os.environ.get('SERVER_MAIL_NOREPLY_USERNAME')
    MAIL_NOREPLY_PASSWORD = os.environ.get('SERVER_MAIL_NOREPLY_PASSWORD')

    # Yookassa settings
    YOOKASSA_SHOP_ID = os.environ.get('YOOKASSA_SHOP_ID')
    YOOKASSA_SECRET_KEY = os.environ.get('YOOKASSA_SECRET_KEY')

    # Celery settings
    CELERY_BROKER_URL = os.environ.get('SERVER_CELERY_BROKER_URL')

    # Business logic settings
    JWT_EXP_HOURS = 72
    PASSWORD_RESET_EXP_HOURS = 1
    ACCOUNT_ACTIVATION_EXP_HOURS = 24

    LOGIN_RATE_LIMIT = os.environ.get('SERVER_LOGIN_RATE_LIMIT', '5 per minute')
    MAX_FAILED_LOGIN_ATTEMPTS = int(os.environ.get('SERVER_MAX_FAILED_LOGIN_ATTEMPTS', 5))

    BOOKING_CONFIRMATION_EXP_HOURS = 1
    BOOKING_PAYMENT_EXP_HOURS = 1
    BOOKING_INVOICE_EXP_HOURS = 24
