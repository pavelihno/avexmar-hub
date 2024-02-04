import os

class Config:
    
    SECRET_KEY = os.environ.get('SECRET_KEY')

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CSRF_ENABLED = True

    DEBUG = True

    basedir = os.path.abspath(os.path.dirname(__file__))