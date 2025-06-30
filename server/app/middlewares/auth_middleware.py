from functools import wraps

from flask import request, jsonify

from models.user import User
from utils.jwt import verifyJWT

def login_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split('Bearer ')[1]
        if not token:
            return jsonify ({'message': 'Authentication required'}), 401
        try:
            user_data = verifyJWT(token)
            current_user = User.get_by_email(user_data.get('email', ''))

            if current_user is None:
                return jsonify ({'message': 'Authentication failed'}), 401
            
            if not current_user.is_active:
                return jsonify ({'message': 'Authentication failed'}), 403

        except Exception as e:
            return jsonify({'message': 'Something went wrong'}), 500

        return f(current_user, *args, **kwargs)

    return decorated

def admin_required(f):

    @wraps(f)
    def decorated(current_user, *args, **kwargs):

        if current_user.role != 'admin':
            return jsonify({'message': 'Access denied'}), 403

        return f(current_user, *args, **kwargs)

    return login_required(decorated)