from app.utils.jwt import signJWT
from app.models.user import User


def test_register(client):
    resp = client.post('/register', json={'email': 'u@example.com', 'password': 'pass'})
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['user']['email'] == 'u@example.com'
    assert 'token' in data


def test_login_and_auth(client):
    User.create(email='test@example.com', password='pass', role='standard', is_active=True)
    resp = client.post('/login', json={'email': 'test@example.com', 'password': 'pass'})
    assert resp.status_code == 200
    token = resp.get_json()['token']
    auth_resp = client.get('/auth', headers={'Authorization': f'Bearer {token}'})
    assert auth_resp.status_code == 200
    assert auth_resp.get_json()['email'] == 'test@example.com'

