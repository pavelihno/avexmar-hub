from datetime import datetime, timedelta

import jwt

from app.config import Config


def signJWT(email):
    token_data = {
        'email': email,
        'exp': datetime.now() + timedelta(hours=Config.JWT_EXP_HOURS)
    }
    return jwt.encode(token_data, Config.SECRET_KEY, algorithm='HS256')


def verifyJWT(token):
    return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])


def sign_activation_token(email):
    token_data = {
        'email': email,
        'exp': datetime.now() + timedelta(hours=Config.ACCOUNT_ACTIVATION_EXP_HOURS)
    }
    return jwt.encode(token_data, Config.SECRET_KEY, algorithm='HS256')


def verify_activation_token(token):
    try:
        return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256']).get('email')
    except Exception:
        return None
