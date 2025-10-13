from flask import request, jsonify
import re

from app.config import Config
from app.constants.messages import AuthMessages
from app.models.user import User
from app.utils.jwt import signJWT, sign_activation_token, verify_activation_token
from app.utils.email import EMAIL_TYPE, send_email
from app.utils.enum import USER_ROLE, DEFAULT_USER_ROLE
from app.middlewares.auth_middleware import login_required

from app.models.password_reset_token import PasswordResetToken


def register():
    body = request.json
    email = body.get('email', '').lower()
    password = body.get('password', '')
    if not email or not password:
        return jsonify({'message': AuthMessages.EMAIL_PASSWORD_REQUIRED}), 400

    existing_user = User.get_by_email(email)
    if existing_user:
        return jsonify({'message': AuthMessages.USER_ALREADY_EXISTS}), 400

    new_user = User.create(**{
        'email': email,
        'password': password,
        'role': DEFAULT_USER_ROLE,
        'is_active': False,
        'first_name': '',
        'last_name': '',
    })
    if new_user:
        token = sign_activation_token(new_user.email)
        activation_url = f"{Config.CLIENT_URL}/activate?token={token}"
        send_email(
            EMAIL_TYPE.account_activation,
            is_noreply=True,
            recipients=[new_user.email],
            activation_url=activation_url,
            expires_in_hours=Config.ACCOUNT_ACTIVATION_EXP_HOURS,
        )
        return jsonify({'message': AuthMessages.ACTIVATION_INSTRUCTIONS_SENT}), 201


def login():
    body = request.json
    email = body.get('email', '').lower()
    password = body.get('password', '')

    user = User.get_by_email(email)
    if not user or not user.is_active:
        return jsonify({'message': AuthMessages.INVALID_EMAIL_OR_PASSWORD}), 401

    if user.is_locked:
        return jsonify({'message': AuthMessages.ACCOUNT_LOCKED}), 401

    user = User.login(email, password)
    if user:
        if user.role == USER_ROLE.admin and re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            totp = user.get_totp(Config.LOGIN_TOTP_INTERVAL_SECONDS)
            code = totp.now()
            send_email(
                EMAIL_TYPE.two_factor,
                is_noreply=True,
                recipients=[user.email],
                code=code,
                expires_in_minutes=Config.LOGIN_TOTP_INTERVAL_SECONDS // 60,
            )
            return jsonify({'message': AuthMessages.TWO_FACTOR_REQUIRED, 'email': user.email}), 200
        token = signJWT(user.email)
        return jsonify({'token': token, 'user': user.to_dict()}), 200
    return jsonify({'message': AuthMessages.INVALID_EMAIL_OR_PASSWORD}), 401


def setup_2fa():
    body = request.json
    email = body.get('email', '').lower()
    user = User.get_by_email(email)
    if not user or user.role != USER_ROLE.admin:
        return jsonify({'message': AuthMessages.USER_NOT_FOUND}), 404
    
    totp = user.get_totp(Config.LOGIN_TOTP_INTERVAL_SECONDS)
    code = totp.now()
    send_email(
        EMAIL_TYPE.two_factor,
        is_noreply=True,
        recipients=[user.email],
        code=code,
        expires_in_minutes=Config.LOGIN_TOTP_INTERVAL_SECONDS // 60,
    )
    return jsonify({'message': AuthMessages.VERIFICATION_CODE_SENT}), 200


def verify_2fa():
    body = request.json
    email = body.get('email', '').lower()
    code = str(body.get('code', ''))
    user = User.get_by_email(email)
    if not user or user.role != USER_ROLE.admin or not user.totp_secret:
        return jsonify({'message': AuthMessages.INVALID_REQUEST}), 400
    totp = user.get_totp(Config.LOGIN_TOTP_INTERVAL_SECONDS)
    if totp.verify(code):
        User.reset_failed_logins(user)
        token = signJWT(user.email)
        return jsonify({'token': token, 'user': user.to_dict()}), 200
    else:
        User.register_failed_login(user)
        return jsonify({'message': AuthMessages.INVALID_CODE}), 400


def forgot_password():
    body = request.json
    email = body.get('email', '').lower()

    if not email:
        return jsonify({'message': AuthMessages.EMAIL_REQUIRED}), 400

    user = User.get_by_email(email)
    if not user:
        return jsonify({'message': AuthMessages.USER_NOT_FOUND}), 404

    token = PasswordResetToken.create(user)
    reset_url = f"{Config.CLIENT_URL}/reset_password?token={token.token}"
    send_email(
        EMAIL_TYPE.password_reset,
        is_noreply=True,
        recipients=[user.email],
        reset_url=reset_url,
        expires_in_hours=Config.PASSWORD_RESET_EXP_HOURS,
    )
    return jsonify({'message': AuthMessages.PASSWORD_RESET_INSTRUCTIONS_SENT}), 200


def reset_password():
    body = request.json
    token_value = body.get('token')
    password = body.get('password', '')
    if not token_value or not password:
        return jsonify({'message': AuthMessages.INVALID_REQUEST}), 400

    token = PasswordResetToken.verify_token(token_value)
    if not token:
        return jsonify({'message': AuthMessages.INVALID_OR_EXPIRED_TOKEN}), 400

    user = User.change_password(token.user_id, password)
    token.used = True
    if user:
        token_jwt = signJWT(user.email)
        return jsonify({'token': token_jwt, 'user': user.to_dict()}), 200
    return jsonify({'message': AuthMessages.USER_NOT_FOUND}), 404


@login_required
def auth(current_user):
    return jsonify(current_user.to_dict()), 200


def activate_account():
    body = request.json
    token_value = body.get('token')
    email = verify_activation_token(token_value) if token_value else None
    if not email:
        return jsonify({'message': AuthMessages.INVALID_OR_EXPIRED_TOKEN}), 400

    user = User.get_by_email(email)
    if not user:
        return jsonify({'message': AuthMessages.USER_NOT_FOUND}), 404

    if user.is_active:
        return jsonify({'message': AuthMessages.ACCOUNT_ALREADY_ACTIVATED}), 200

    User.update(user.id, commit=True, is_active=True)
    return jsonify({'message': AuthMessages.ACCOUNT_ACTIVATED}), 200
