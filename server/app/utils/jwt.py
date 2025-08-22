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
