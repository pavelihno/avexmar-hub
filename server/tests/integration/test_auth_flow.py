def test_register(client):
    """Test user registration flow"""
    resp = client.post('/register', json={'email': 'newuser@example.com', 'password': 'pass'})
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['user']['email'] == 'newuser@example.com'
    assert 'token' in data


def test_login_and_auth(client, standard_user):
    """Test login and authentication flow using standard user fixture"""
    # Use the standard_user fixture instead of creating a new user
    resp = client.post('/login', json={
        'email': standard_user.email,
        'password': 'password'  # This matches the password in our fixture
    })
    assert resp.status_code == 200
    token = resp.get_json()['token']

    auth_resp = client.get('/auth', headers={'Authorization': f'Bearer {token}'})
    assert auth_resp.status_code == 200
    assert auth_resp.get_json()['email'] == standard_user.email


def test_forgot_password(client, standard_user):
    resp = client.post('/forgot_password', json={'email': standard_user.email})
    assert resp.status_code == 200
    assert resp.get_json()['message'] == 'Password reset instructions sent'


def test_forgot_password_not_found(client):
    resp = client.post('/forgot_password', json={'email': 'missing@example.com'})
    assert resp.status_code == 404
