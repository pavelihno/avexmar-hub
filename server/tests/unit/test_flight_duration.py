from datetime import datetime, date, time
from zoneinfo import ZoneInfo

from app.models.flight import Flight


def test_get_duration_minutes_with_timezones(route_moscow_pevek, su_airline):
    dep_date = date(2025, 1, 1)
    dep_time = time(10, 0)
    arr_date = date(2025, 1, 1)
    arr_time = time(20, 0)

    flight = Flight.create(
        flight_number='SU300',
        airline_id=su_airline.id,
        route_id=route_moscow_pevek.id,
        scheduled_departure=dep_date,
        scheduled_departure_time=dep_time,
        scheduled_arrival=arr_date,
        scheduled_arrival_time=arr_time,
    )

    depart_dt = datetime.combine(dep_date, dep_time, tzinfo=ZoneInfo('Europe/Moscow'))
    arrive_dt = datetime.combine(arr_date, arr_time, tzinfo=ZoneInfo('Asia/Anadyr'))
    expected = int((arrive_dt - depart_dt).total_seconds() // 60)

    assert flight.get_duration_minutes() == expected
