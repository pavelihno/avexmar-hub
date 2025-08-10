import datetime

from app.config import Config
from app.models.booking import Booking
from app.models.booking_flight import BookingFlight
from app.models.booking_passenger import BookingPassenger
from app.models.passenger import Passenger


def _create_booking_with_flight(flight):
    booking = Booking.create(
        currency=Config.CURRENCY.rub,
        fare_price=0.0,
        fees=0.0,
        total_discounts=0.0,
        total_price=0.0,
    )
    BookingFlight.create(booking_id=booking.id, flight_id=flight.id)
    return booking


def test_process_booking_passengers_creates_and_updates(client, future_flight, country_ru):
    booking = _create_booking_with_flight(future_flight)

    payload = {
        "public_id": str(booking.public_id),
        "buyer": {"email": "a@example.com", "phone": "+70000000000"},
        "passengers": [
            {
                "category": "adult",
                "first_name": "John",
                "last_name": "Doe",
                "gender": Config.GENDER.м.value,
                "birth_date": "1990-01-01",
                "document_type": Config.DOCUMENT_TYPE.passport.value,
                "document_number": "123456",
                "citizenship_id": country_ru.id,
            }
        ],
    }
    res = client.post("/bookings/process/passengers", json=payload)
    assert res.status_code == 200

    bp = BookingPassenger.query.filter_by(booking_id=booking.id).first()
    pid = bp.passenger_id
    passenger = Passenger.get_or_404(pid)
    assert passenger.last_name == "DOE"

    payload["passengers"][0]["id"] = pid
    payload["passengers"][0]["last_name"] = "Smith"
    res = client.post("/bookings/process/passengers", json=payload)
    assert res.status_code == 200
    passenger = Passenger.get_or_404(pid)
    assert passenger.last_name == "SMITH"
    assert BookingPassenger.query.filter_by(booking_id=booking.id).count() == 1


def test_process_booking_passengers_validates_age(client, future_flight, country_ru):
    booking = _create_booking_with_flight(future_flight)

    two_years_ago = (datetime.date.today() - datetime.timedelta(days=730)).isoformat()
    payload = {
        "public_id": str(booking.public_id),
        "buyer": {"email": "a@example.com", "phone": "+70000000000"},
        "passengers": [
            {
                "category": "infant",
                "first_name": "Baby",
                "last_name": "Test",
                "gender": Config.GENDER.м.value,
                "birth_date": two_years_ago,
                "document_type": Config.DOCUMENT_TYPE.passport.value,
                "document_number": "123456",
                "citizenship_id": country_ru.id,
            }
        ],
    }
    res = client.post("/bookings/process/passengers", json=payload)
    assert res.status_code == 400
    assert any("not an infant" in e for e in res.json["errors"])
