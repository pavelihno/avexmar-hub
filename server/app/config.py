import os
import enum


class Config:

    CLIENT_URL = os.environ.get('SERVER_CLIENT_URL')

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    SECRET_KEY = os.environ.get('SERVER_SECRET_KEY')

    JWT_EXP_HOURS = int(os.environ.get('SERVER_JWT_EXP_HOURS'))

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

    # Enum classes
    class USER_ROLE(enum.Enum):
        admin = 'admin'
        standard = 'standard'

    class BOOKING_STATUS(enum.Enum):
        created = 'created'
        pending_payment = 'pending_payment'
        confirmed = 'confirmed'
        cancelled = 'cancelled'

    class DISCOUNT_TYPE(enum.Enum):
        round_trip = 'round_trip'
        infant = 'infant'
        child = 'child'

    class GENDER(enum.Enum):
        м = 'м'
        ж = 'ж'

    class DOCUMENT_TYPE(enum.Enum):
        passport = 'passport'
        foreign_passport = 'foreign_passport'
        international_passport = 'international_passport'
        birth_certificate = 'birth_certificate'

    class CURRENCY(enum.Enum):
        rub = 'rub'

    class FLIGHT_STATUS(enum.Enum):
        scheduled = 'scheduled'
        delayed = 'delayed'
        departed = 'departed'
        arrived = 'arrived'
        cancelled = 'cancelled'

    class SEAT_CLASS(enum.Enum):
        economy = 'economy'
        business = 'business'

    class PAYMENT_STATUS(enum.Enum):
        pending = 'pending'
        paid = 'paid'
        refunded = 'refunded'
        failed = 'failed'

    class PAYMENT_METHOD(enum.Enum):
        card = 'card'
        cash = 'cash'

    # Default variables
    DEFAULT_USER_ROLE = USER_ROLE.standard
    DEFAULT_BOOKING_STATUS = BOOKING_STATUS.created
    DEFAULT_CURRENCY = CURRENCY.rub
    DEFAULT_FLIGHT_STATUS = FLIGHT_STATUS.scheduled
    DEFAULT_PAYMENT_STATUS = PAYMENT_STATUS.pending
