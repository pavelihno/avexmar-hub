import os


class Config:

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    SECRET_KEY = os.environ.get('SERVER_SECRET_KEY')

    JWT_EXP_HOURS = int(os.environ.get('SERVER_JWT_EXP_HOURS'))

    SQLALCHEMY_DATABASE_URI = os.environ.get('SERVER_DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CSRF_ENABLED = True

    # Default variables
    DEFAULT_CURRENCY = os.environ.get('DEFAULT_CURRENCY')
    DEFAULT_FLIGHT_STATUS = os.environ.get('DEFAULT_FLIGHT_STATUS')
    DEFAULT_SEAT_CLASS = os.environ.get('DEFAULT_SEAT_CLASS')
    DEFAULT_PAYMENT_STATUS = os.environ.get('DEFAULT_PAYMENT_STATUS')
    DEFAULT_PAYMENT_METHOD = os.environ.get('DEFAULT_PAYMENT_METHOD')

    # Enumerations
    def extract_enum_values(env_var, default_values=''):
        return [v.strip() for v in os.environ.get(env_var, default_values).split(',') if v.strip()]

    ENUM_GENDER = extract_enum_values('ENUM_GENDER')
    ENUM_CURRENCY = extract_enum_values('ENUM_CURRENCY')
    ENUM_FLIGHT_STATUS = extract_enum_values('ENUM_FLIGHT_STATUS')
    ENUM_SEAT_CLASS = extract_enum_values('ENUM_SEAT_CLASS')
    ENUM_PAYMENT_STATUS = extract_enum_values('ENUM_PAYMENT_STATUS')
    ENUM_PAYMENT_METHOD = extract_enum_values('ENUM_PAYMENT_METHOD')
