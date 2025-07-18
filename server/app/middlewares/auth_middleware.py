from functools import wraps

from flask import request, jsonify
from jwt import InvalidTokenError

from app.config import Config
from app.models.user import User
from app.utils.jwt import verifyJWT


def login_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ', 1)[1]
        if not token:
            return jsonify({'message': 'Authentication required'}), 401
        try:
            user_data = verifyJWT(token)
            current_user = User.get_by_email(user_data.get('email', ''))

            if current_user is None:
                return jsonify({'message': 'Authentication failed'}), 401

            if not current_user.is_active:
                return jsonify({'message': 'Authentication failed'}), 403

        except InvalidTokenError:
            return jsonify({'message': 'Authentication failed'}), 401
        except Exception:
            return jsonify({'message': 'Authentication failed'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):

    @wraps(f)
    def decorated(current_user, *args, **kwargs):

        if current_user.role != Config.USER_ROLE.admin:
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
