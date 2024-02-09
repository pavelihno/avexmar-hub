from flask import request, jsonify

from models.user import User
from utils.jwt import signJWT

def register():
    body = request.json
    new_user = User.create(**{
        'email': body['email'],
        'password': body['password'],
        'role': 'standard',
        'is_active': True
    })
    if new_user:
        return jsonify(new_user.to_dict()), 201
    return jsonify({'message': 'Invalid email or password'}), 400

def login():
    body = request.json
    email = body['email']
    password = body['password']

    user = User.login(email, password)
    if user:
        token = signJWT(email)
        return jsonify(token), 200
    return jsonify({'message': 'Invalid email or password'}), 401