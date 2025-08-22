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
    MAIL_USERNAME = os.environ.get('SERVER_MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('SERVER_MAIL_PASSWORD')
    MAIL_USE_TLS = os.environ.get('SERVER_MAIL_USE_TLS') == 'True'
    MAIL_USE_SSL = os.environ.get('SERVER_MAIL_USE_SSL') == 'True'
    MAIL_DEFAULT_SENDER = os.environ.get('SERVER_MAIL_DEFAULT_SENDER')

    # Yookassa settings
    YOOKASSA_SHOP_ID = os.environ.get('YOOKASSA_SHOP_ID')
    YOOKASSA_SECRET_KEY = os.environ.get('YOOKASSA_SECRET_KEY')
    YOOKASSA_USE_MOCK = os.environ.get('YOOKASSA_USE_MOCK') == 'True'
    YOOKASSA_API_URL = (
        os.environ.get('YOOKASSA_MOCK_URL')
        if YOOKASSA_USE_MOCK
        else os.environ.get('YOOKASSA_API_URL')
    )

    # Celery settings
    CELERY_BROKER_URL = os.environ.get(
        'SERVER_CELERY_BROKER_URL',
        f"redis://:{os.environ.get('REDIS_PASSWORD', '')}@redis:6379/0",
    )
    CELERY_RESULT_BACKEND = os.environ.get(
        'SERVER_CELERY_RESULT_BACKEND',
        CELERY_BROKER_URL,
    )

    # Business logic settings
    JWT_EXP_HOURS = 72
    PASSWORD_RESET_EXP_HOURS = 1

    BOOKING_CONFIRMATION_EXP_HOURS = 1
    BOOKING_PAYMENT_EXP_HOURS = 1
    BOOKING_INVOICE_EXP_HOURS = 24
