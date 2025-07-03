from app.models.user import User
from app.models.airport import Airport
from app.utils.jwt import signJWT


def create_admin():
    return User.create(email='admin2@example.com', password='admin', role='admin', is_active=True)


def admin_headers():
    admin = create_admin()
    token = signJWT(admin.email)
    return {'Authorization': f'Bearer {token}'}


def test_create_airport_requires_admin(client):
    headers = admin_headers()
    resp = client.post('/airports', headers=headers, json={
        'iata_code': 'AAA',
        'icao_code': 'AAAA',
        'name': 'Test Airport',
        'city_code': 'CTY',
        'country_code': 'RU'
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['iata_code'] == 'AAA'

    # request without token
    resp = client.post('/airports', json={})
    assert resp.status_code == 401

