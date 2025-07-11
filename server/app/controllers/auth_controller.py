from flask import request, jsonify

from app.models.user import User
from app.utils.jwt import signJWT
from app.middlewares.auth_middleware import login_required
from app.config import Config


def register():
    body = request.json
    new_user = User.create(**{
        'email': body.get('email', ''),
        'password': body.get('password', ''),
        'role': Config.DEFAULT_USER_ROLE,
        'is_active': True
    })
    if new_user:
        token = signJWT(new_user.email)
        return jsonify({'token': token, 'user': new_user.to_dict()}), 201
    return jsonify({'message': 'Invalid email or password'}), 400


def login():
    body = request.json
    email = body.get('email', '')
    password = body.get('password', '')

    user = User.login(email, password)
    if user:
        token = signJWT(email)
        return jsonify({'token': token, 'user': user.to_dict()}), 200
    return jsonify({'message': 'Invalid email or password'}), 401


@login_required
def auth(current_user):
    return jsonify(current_user.to_dict()), 200
