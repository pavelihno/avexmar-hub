import os
import enum


class Config:

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    SECRET_KEY = os.environ.get('SERVER_SECRET_KEY')

    JWT_EXP_HOURS = int(os.environ.get('SERVER_JWT_EXP_HOURS'))

    SQLALCHEMY_DATABASE_URI = os.environ.get('SERVER_DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CSRF_ENABLED = True

    # Enum classes
    class USER_ROLE(enum.Enum):
        ADMIN = 'admin'
        STANDARD = 'standard'

    class BOOKING_STATUS(enum.Enum):
        CREATED = 'created'
        PENDING_PAYMENT = 'pending_payment'
        CONFIRMED = 'confirmed'
        CANCELLED = 'cancelled'

    class DISCOUNT_TYPE(enum.Enum):
        ROUND_TRIP = 'round_trip'
        INFANT = 'infant'
        CHILD = 'child'

    class GENDER(enum.Enum):
        М = 'м'
        Ж = 'ж'

    class DOCUMENT_TYPE(enum.Enum):
        PASSPORT = 'passport'
        FOREIGN_PASSPORT = 'foreign_passport'
        INTERNATIONAL_PASSPORT = 'international_passport'
        BIRTH_CERTIFICATE = 'birth_certificate'

    class CURRENCY(enum.Enum):
        RUB = 'rub'

    class FLIGHT_STATUS(enum.Enum):
        SCHEDULED = 'scheduled'
        DELAYED = 'delayed'
        DEPARTED = 'departed'
        ARRIVED = 'arrived'
        CANCELLED = 'cancelled'

    class SEAT_CLASS(enum.Enum):
        ECONOMY = 'economy'
        BUSINESS = 'business'

    class PAYMENT_STATUS(enum.Enum):
        PENDING = 'pending'
        PAID = 'paid'
        REFUNDED = 'refunded'
        FAILED = 'failed'

    class PAYMENT_METHOD(enum.Enum):
        CARD = 'card'
        CASH = 'cash'

    # Default variables
    DEFAULT_USER_ROLE = USER_ROLE.STANDARD
    DEFAULT_BOOKING_STATUS = BOOKING_STATUS.CREATED
    DEFAULT_CURRENCY = CURRENCY.RUB
    DEFAULT_FLIGHT_STATUS = FLIGHT_STATUS.SCHEDULED
    DEFAULT_PAYMENT_STATUS = PAYMENT_STATUS.PENDING
