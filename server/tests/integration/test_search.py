import datetime

from app.config import Config

def test_search_flights(client, future_flight, economy_flight_tariff, economy_tariff):
    date_str = future_flight.scheduled_departure.strftime('%Y-%m-%d')
    resp = client.get('/search/flights', query_string={
        'from': 'SVO',
        'to': 'PWE',
        'when': date_str,
        'class': Config.SEAT_CLASS.economy.value,
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert any(f['id'] == future_flight.id for f in data)
    found = next(f for f in data if f['id'] == future_flight.id)
    assert found['price'] == economy_tariff.price


def test_search_price_by_class(
    client,
    future_flight,
    economy_flight_tariff,
    business_flight_tariff,
    economy_tariff,
    business_tariff,
):
    date_str = future_flight.scheduled_departure.strftime('%Y-%m-%d')
    resp = client.get(
        '/search/flights',
        query_string={
            'from': 'SVO',
            'to': 'PWE',
            'when': date_str,
            'class': Config.SEAT_CLASS.business.value,
            'adults': 1,
        },
    )
    assert resp.status_code == 200
    data = resp.get_json()
    flight = next(f for f in data if f['id'] == future_flight.id)
    assert flight['price'] == business_tariff.price
    assert flight['min_price'] == business_tariff.price

def test_search_flights_range(client, future_flight, economy_flight_tariff):
    start = (future_flight.scheduled_departure - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
    end = (future_flight.scheduled_departure + datetime.timedelta(days=1)).strftime('%Y-%m-%d')
    resp = client.get('/search/flights', query_string={
        'from': 'SVO',
        'to': 'PWE',
        'when_from': start,
        'when_to': end,
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert any(f['id'] == future_flight.id for f in data)


def test_search_flights_by_number(client, future_flight, economy_flight_tariff):
    date_str = future_flight.scheduled_departure.strftime('%Y-%m-%d')
    resp = client.get(
        '/search/flights',
        query_string={
            'from': 'SVO',
            'to': 'PWE',
            'when': date_str,
            'date_mode': 'exact',
            'flight': future_flight.flight_number,
        },
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]['flight_number'] == future_flight.flight_number
