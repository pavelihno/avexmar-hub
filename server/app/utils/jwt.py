from datetime import datetime, timedelta

import jwt

from config import Config


def signJWT(email):
    exp_hours = Config.JWT_EXP_HOURS
    token_data = {
        'email': email,
        'exp': datetime.now() + timedelta(hours=exp_hours)
    }
    return jwt.encode(token_data, Config.SECRET_KEY, algorithm='HS256')


def verifyJWT(token):
    return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
