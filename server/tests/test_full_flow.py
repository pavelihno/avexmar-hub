from datetime import datetime

from app.models.user import User
from app.models.airport import Airport
from app.models.route import Route
from app.models.flight import Flight
from app.models.tariff import Tariff
from app.models.passenger import Passenger
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.seat import Seat
from app.utils.jwt import signJWT


def admin_token():
    admin = User.create(email='chain_admin@example.com', password='admin', role='admin', is_active=True)
    return signJWT(admin.email)


def user_token():
    user = User.create(email='chain_user@example.com', password='user', role='standard', is_active=True)
    return signJWT(user.email)


def test_full_booking_flow(client):
    a1 = Airport.create(iata_code='BBB', icao_code='BBBB', name='A1', city_code='C1', country_code='RU')
    a2 = Airport.create(iata_code='CCC', icao_code='CCCC', name='A2', city_code='C2', country_code='RU')
    headers_admin = {'Authorization': f'Bearer {admin_token()}'}
    headers_user = {'Authorization': f'Bearer {user_token()}'}

    # create route
    resp = client.post('/routes', headers=headers_admin, json={
        'flight_number': 'FN1',
        'origin_airport_id': a1.id,
        'destination_airport_id': a2.id
    })
    assert resp.status_code == 201
    route_id = resp.get_json()['id']

    # create flight
    resp = client.post('/flights', headers=headers_admin, json={
        'route_id': route_id,
        'scheduled_departure': datetime.utcnow().isoformat(),
        'scheduled_arrival': datetime.utcnow().isoformat()
    })
    assert resp.status_code == 201
    flight_id = resp.get_json()['id']

    # create tariff
    resp = client.post('/tariffs', headers=headers_admin, json={
        'flight_id': flight_id,
        'seat_class': 'economy',
        'price': 100.0,
        'seats_number': 10,
        'currency': 'RUB'
    })
    assert resp.status_code == 201
    tariff_id = resp.get_json()['id']

    # create passenger
    resp = client.post('/passengers', headers=headers_user, json={
        'full_name': 'Ivan Ivanov',
        'document_number': 'DOC1',
        'birth_date': '2000-01-01',
        'gender': 'М',
        'is_infant': False
    })
    assert resp.status_code == 201
    passenger_id = resp.get_json()['id']

    # create booking
    resp = client.post('/bookings', headers=headers_user, json={
        'flight_id': flight_id,
        'base_price': 100.0,
        'tax_amount': 0.0,
        'discount_amount': 0.0,
        'final_price': 100.0,
        'currency': 'RUB'
    })
    assert resp.status_code == 201
    booking_id = resp.get_json()['id']

    # create seat
    resp = client.post('/seats', headers=headers_user, json={
        'seat_number': '1A',
        'flight_id': flight_id,
        'tariff_id': tariff_id,
        'passenger_id': passenger_id,
        'booking_id': booking_id
    })
    assert resp.status_code == 201
    seat_id = resp.get_json()['id']

    # create payment
    resp = client.post('/payments', headers=headers_user, json={
        'booking_id': booking_id,
        'payment_method': 'card',
        'payment_status': 'pending'
    })
    assert resp.status_code == 201
    assert resp.get_json()['booking_id'] == booking_id

    # cleanup to ensure seat exists
    assert Seat.get_by_id(seat_id) is not None

