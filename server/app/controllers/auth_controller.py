from flask import request, jsonify

from app.config import Config
from app.models.user import User
from app.utils.jwt import signJWT, sign_activation_token, verify_activation_token
from app.utils.email import EMAIL_TYPE, send_email
from app.utils.enum import USER_ROLE, DEFAULT_USER_ROLE
from app.middlewares.auth_middleware import login_required

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

    new_user = User.create(**{
        'email': email,
        'password': password,
        'role': DEFAULT_USER_ROLE,
        'is_active': False
    })
    if new_user:
        token = sign_activation_token(new_user.email)
        activation_url = f"{Config.CLIENT_URL}/activate?token={token}"
        send_email(
            EMAIL_TYPE.account_activation,
            recipients=[new_user.email],
            is_noreply=True,
            activation_url=activation_url,
            expires_in_hours=Config.ACCOUNT_ACTIVATION_EXP_HOURS,
        )
        return jsonify({'message': 'Activation instructions sent'}), 201


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

    token = PasswordResetToken.create(user)
    reset_url = f"{Config.CLIENT_URL}/reset_password?token={token.token}"
    send_email(
        EMAIL_TYPE.password_reset,
        recipients=[user.email],
        is_noreply=True,
        reset_url=reset_url,
        expires_in_hours=Config.PASSWORD_RESET_EXP_HOURS,
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

    user = User.change_password(token.user_id, password)
    token.used = True
    if user:
        token_jwt = signJWT(user.email)
        return jsonify({'token': token_jwt, 'user': user.to_dict()}), 200
    return jsonify({'message': 'User not found'}), 404


@login_required
def auth(current_user):
    return jsonify(current_user.to_dict()), 200


def activate_account():
    body = request.json
    token_value = body.get('token')
    email = verify_activation_token(token_value) if token_value else None
    if not email:
        return jsonify({'message': 'Invalid or expired token'}), 400

    user = User.get_by_email(email)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    if user.is_active:
        return jsonify({'message': 'Account already activated'}), 200

    User.update(user.id, commit=True, is_active=True)
    return jsonify({'message': 'Account activated'}), 200
