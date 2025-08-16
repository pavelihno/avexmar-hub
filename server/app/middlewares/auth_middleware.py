from functools import wraps

from flask import request, jsonify
from jwt import InvalidTokenError

from app.config import Config
from app.models.user import User
from app.utils.jwt import verifyJWT
from app.utils.enum import USER_ROLE


def current_user(f):

    @wraps(f)
    def decorated(*args, **kwargs):
        user = None
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ', 1)[1].strip()
        if not token:
            pass
        else:
            try:
                user_data = verifyJWT(token) or {}
                email = user_data.get('email')
                if email:
                    user = User.get_by_email(email)
            except InvalidTokenError:
                pass
            except Exception:
                pass

        return f(user, *args, **kwargs)

    return decorated


def login_required(f):

    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user is None:
            return jsonify({'message': 'Authentication failed'}), 401

        if not current_user.is_active:
            return jsonify({'message': 'Authentication failed'}), 403

        return f(current_user, *args, **kwargs)

    return current_user(decorated)


def admin_required(f):

    @wraps(f)
    def decorated(current_user, *args, **kwargs):

        if current_user.role != USER_ROLE.admin:
            return jsonify({'message': 'Access denied'}), 403

        return f(current_user, *args, **kwargs)

    return login_required(decorated)


def dev_tool(f):

    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if Config.APP_ENV not in ('dev', 'test'):
            return jsonify({'message': 'Operation not permitted'}), 403
        return f(current_user, *args, **kwargs)

    return admin_required(decorated)
