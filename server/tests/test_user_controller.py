from app.models.user import User
from app.utils.jwt import signJWT


def create_admin():
    return User.create(email='admin@example.com', password='admin', role='admin', is_active=True)


def create_user():
    return User.create(email='user@example.com', password='user', role='standard', is_active=True)


def test_get_users_admin_only(client):
    admin = create_admin()
    token_admin = signJWT(admin.email)
    resp = client.get('/users', headers={'Authorization': f'Bearer {token_admin}'})
    assert resp.status_code == 200

    user = create_user()
    token_user = signJWT(user.email)
    resp = client.get('/users', headers={'Authorization': f'Bearer {token_user}'})
    assert resp.status_code == 403

