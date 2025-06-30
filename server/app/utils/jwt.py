from datetime import datetime, timedelta

import jwt

from flask import current_app

def signJWT(email):
    token_data = {'email': email, 'exp': datetime.now() + timedelta(hours=24)}
    return jwt.encode(token_data, current_app.config['SECRET_KEY'], algorithm='HS256')

def verifyJWT(token):
    return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])