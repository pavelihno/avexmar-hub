from flask import request, jsonify

from app.models.user import User
from app.middlewares.auth_middleware import admin_required, login_required
from app.models._base_model import ModelValidationError


@admin_required
def create_user(current_user):
    body = request.json
    if 'email' in body and isinstance(body['email'], str):
        body['email'] = body['email'].lower()
    try:
        new_user = User.create(**body)
        if new_user:
            return jsonify(new_user.to_dict()), 201
        return jsonify({'message': 'User not created'}), 400
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def get_users(current_user):
    users = User.get_all()
    return jsonify([user.to_dict() for user in users])


@admin_required
def get_user(current_user, user_id):
    user = User.get_by_id(user_id)
    if user:
        return jsonify(user.to_dict())
    return jsonify({'message': 'User not found'}), 404


@admin_required
def update_user(current_user, user_id):
    body = request.json
    try:
        updated_user = User.update(user_id, **body)
        if updated_user:
            return jsonify(updated_user.to_dict())
        return jsonify({'message': 'User not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_user(current_user, user_id):
    deleted_user = User.delete(user_id)
    if deleted_user:
        return jsonify(deleted_user.to_dict())
    return jsonify({'message': 'User not found'}), 404


def __set_user_activity(user_id, is_active):
    try:
        updated_user = User.update(user_id, is_active=is_active)
        if updated_user:
            return jsonify(updated_user.to_dict())
        return jsonify({'message': 'User not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def activate_user(current_user, user_id):
    return __set_user_activity(user_id, True)


@admin_required
def deactivate_user(current_user, user_id):
    return __set_user_activity(user_id, False)


@login_required
def change_password(current_user):
    body = request.json
    password = body.get('password', '')

    if not password:
        return jsonify({'message': 'Invalid password'}), 404
    try:
        updated_user = User.change_password(current_user.id, password)
        if updated_user:
            return jsonify(updated_user.to_dict())
        return jsonify({'message': 'User not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
