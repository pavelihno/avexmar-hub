import os


class Config:

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    SECRET_KEY = os.environ.get('SECRET_KEY')

    DEFAULT_CURRENCY = os.getenv('DEFAULT_CURRENCY', 'RUB')

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CSRF_ENABLED = True
