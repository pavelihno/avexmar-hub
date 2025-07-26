import datetime

def test_search_flights(client, future_flight, economy_flight_tariff, economy_tariff):
    date_str = future_flight.scheduled_departure.strftime('%Y-%m-%d')
    resp = client.get('/search/flights', query_string={
        'from': 'SVO',
        'to': 'PWE',
        'when': date_str,
        'class': 'economy',
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert any(f['id'] == future_flight.id for f in data)
    found = next(f for f in data if f['id'] == future_flight.id)
    assert found['price'] == economy_tariff.price
