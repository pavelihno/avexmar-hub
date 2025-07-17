from flask import request, jsonify

from app.models.user import User
from app.utils.jwt import signJWT
from app.utils.email import send_email
from app.middlewares.auth_middleware import login_required
from app.config import Config
from app.models._base_model import ModelValidationError


def register():
    body = request.json
    email = body.get('email', '').lower()
    password = body.get('password', '')
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    existing_user = User.get_by_email(email)
    if existing_user:
        return jsonify({'message': 'User already exists'}), 400

    try:
        new_user = User.create(**{
            'email': email,
            'password': password,
            'role': Config.DEFAULT_USER_ROLE,
            'is_active': True
        })
        if new_user:
            token = signJWT(new_user.email)
            return jsonify({'token': token, 'user': new_user.to_dict()}), 201

    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


def login():
    body = request.json
    email = body.get('email', '').lower()
    password = body.get('password', '')

    user = User.login(email, password)
    if user:
        token = signJWT(user.email)
        return jsonify({'token': token, 'user': user.to_dict()}), 200
    return jsonify({'message': 'Invalid email or password'}), 401


def forgot_password():
    body = request.json
    email = body.get('email', '').lower()

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    user = User.get_by_email(email)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    reset_url = f"http://localhost:3000/reset_password?email={user.email}"
    send_email(
        'Password Reset',
        [user.email],
        'forgot_password.txt',
        reset_url=reset_url,
    )
    return jsonify({'message': 'Password reset instructions sent'}), 200


@login_required
def auth(current_user):
    return jsonify(current_user.to_dict()), 200
