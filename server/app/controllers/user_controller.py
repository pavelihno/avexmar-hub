from flask import request, jsonify

from app.models.user import User
from app.models.booking import Booking
from app.models.passenger import Passenger
import base64
import hashlib
import pyotp

from app.utils.enum import USER_ROLE, CONSENT_EVENT_TYPE, CONSENT_DOC_TYPE
from app.middlewares.auth_middleware import admin_required, login_required
from app.utils.consent import create_user_consent
from app.utils.email import send_email, EMAIL_TYPE
from app.config import Config


@admin_required
def create_user(current_user):
    body = request.json
    if 'email' in body and isinstance(body['email'], str):
        body['email'] = body['email'].lower()
    new_user = User.create(**body)
    if new_user:
        return jsonify(new_user.to_dict()), 201
    return jsonify({'message': 'User not created'}), 400


@admin_required
def get_users(current_user):
    users = User.get_all()
    return jsonify([user.to_dict() for user in users])


@admin_required
def get_user(current_user, user_id):
    user = User.get_or_404(user_id)
    return jsonify(user.to_dict())


@login_required
def update_user(current_user, user_id):
    if current_user.id != user_id and current_user.role != USER_ROLE.admin:
        return jsonify({'message': 'Forbidden'}), 403

    body = request.json or {}

    personal_fields = any(k in body for k in ['first_name', 'last_name', 'phone_number'])
    if current_user.id == user_id and personal_fields:
        consent = body.pop('consent', False)
        if not consent:
            return jsonify({'message': 'Consent required'}), 400
        create_user_consent(
            current_user,
            CONSENT_EVENT_TYPE.pd_processing,
            CONSENT_DOC_TYPE.pd_policy,
        )

    updated_user = User.update(user_id, **body)
    if updated_user:
        return jsonify(updated_user.to_dict())
    return jsonify({'message': 'User not found'}), 404


@admin_required
def delete_user(current_user, user_id):
    deleted_user = User.delete_or_404(user_id, commit=True)
    return jsonify(deleted_user)


def __set_user_activity(user_id, is_active):
    updated_user = User.update(user_id, is_active=is_active)
    if updated_user:
        return jsonify(updated_user.to_dict())
    return jsonify({'message': 'User not found'}), 404


@admin_required
def activate_user(current_user, user_id):
    return __set_user_activity(user_id, True)


@admin_required
def deactivate_user(current_user, user_id):
    return __set_user_activity(user_id, False)


@login_required
def get_user_bookings(current_user, user_id):
    if current_user.id != user_id and current_user.role != USER_ROLE.admin:
        return jsonify({'message': 'Forbidden'}), 403
    bookings = Booking.query.filter_by(user_id=user_id).all()
    return jsonify([b.to_dict() for b in bookings])


@login_required
def get_user_passengers(current_user, user_id):
    if current_user.id != user_id and current_user.role != USER_ROLE.admin:
        return jsonify({'message': 'Forbidden'}), 403
    passengers = Passenger.query.filter_by(owner_user_id=user_id).all()
    return jsonify([p.to_dict() for p in passengers])


@login_required
def create_user_passenger(current_user, user_id):
    if current_user.id != user_id and current_user.role != USER_ROLE.admin:
        return jsonify({'message': 'Forbidden'}), 403
    body = request.json or {}
    passenger = Passenger.create(owner_user_id=user_id, **body)
    return jsonify(passenger.to_dict()), 201


@login_required
def change_password(current_user):
    body = request.json or {}
    password = body.get('password', '')
    code = body.get('code')

    if not password:
        return jsonify({'message': 'Invalid password'}), 400

    secret_source = f'{current_user.email}{password}{Config.SECRET_KEY}'
    digest = hashlib.sha256(secret_source.encode()).digest()
    secret = base64.b32encode(digest).decode()
    totp = pyotp.TOTP(secret, interval=Config.PASSWORD_CHANGE_TOTP_INTERVAL_SECONDS)

    if code:
        if not totp.verify(str(code)):
            return jsonify({'message': 'Invalid or expired code'}), 400
        updated_user = User.change_password(current_user.id, password)
        return jsonify(updated_user.to_dict())

    verification_code = totp.now()
    send_email(
        EMAIL_TYPE.password_change,
        is_noreply=True,
        recipients=[current_user.email],
        code=verification_code,
        expires_in_minutes=Config.PASSWORD_CHANGE_TOTP_INTERVAL_SECONDS // 60,
    )
    return jsonify({'message': 'Verification code sent'})
