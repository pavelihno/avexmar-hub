from app.models.password_reset_token import PasswordResetToken
from app.models.user import User


def test_password_reset_flow(client, standard_user):
    resp = client.post('/forgot_password', json={'email': standard_user.email})
    assert resp.status_code == 200

    token = PasswordResetToken.query.filter(user_id=standard_user.id).first()
    assert token is not None

    resp = client.post('/reset_password', json={'token': token.token, 'password': 'newpass'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'token' in data
    assert data['user']['email'] == standard_user.email

    # token should be marked used
    assert token.used is True

    # password should be changed
    assert User.login(standard_user.email, 'newpass') is not None

    # reuse should fail
    resp = client.post('/reset_password', json={'token': token.token, 'password': 'another'})
    assert resp.status_code == 400


def test_password_reset_expired_token(client, standard_user):
    resp = client.post('/forgot_password', json={'email': standard_user.email})
    assert resp.status_code == 200
    token = PasswordResetToken.query.filter(user_id=standard_user.id).first()
    assert token is not None

    token.expires_at = token.expires_at.replace(year=2000)
    from app.database import db
    db.session.commit()

    resp = client.post('/reset_password', json={'token': token.token, 'password': 'newpass'})
    assert resp.status_code == 400
