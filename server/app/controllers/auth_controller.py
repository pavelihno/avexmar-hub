from flask import request, jsonify

from app.models.user import User
from app.utils.jwt import signJWT
from app.utils.email import send_email
from app.middlewares.auth_middleware import login_required
from app.config import Config
from app.models._base_model import ModelValidationError
from app.models.password_reset_token import PasswordResetToken
from app.database import db


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

    token = PasswordResetToken.create_token(user, expires_in_hours=1)
    reset_url = f"{Config.CLIENT_URL}/reset_password?token={token.token}"
    send_email(
        'Password Reset',
        [user.email],
        'forgot_password.txt',
        reset_url=reset_url,
    )
    return jsonify({'message': 'Password reset instructions sent'}), 200


def reset_password():
    body = request.json
    token_value = body.get('token')
    password = body.get('password', '')
    if not token_value or not password:
        return jsonify({'message': 'Invalid request'}), 400

    token = PasswordResetToken.verify_token(token_value)
    if not token:
        return jsonify({'message': 'Invalid or expired token'}), 400

    try:
        user = User.change_password(token.user_id, password)
        token.used = True
        db.session.commit()
        if user:
            return jsonify({'message': 'Password reset successful'}), 200
        return jsonify({'message': 'User not found'}), 404
    except ModelValidationError as e:
        db.session.rollback()
        return jsonify({'errors': e.errors}), 400


@login_required
def auth(current_user):
    return jsonify(current_user.to_dict()), 200
