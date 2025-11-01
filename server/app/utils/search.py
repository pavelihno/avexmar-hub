from collections.abc import Iterable
from datetime import date
from typing import Any, TYPE_CHECKING

from sqlalchemy import and_, or_, false, true
from sqlalchemy.orm import aliased, Session
from sqlalchemy.sql import func

from app.database import db
from app.models.airline import Airline
from app.models.airport import Airport
from app.models.flight import Flight
from app.models.flight_tariff import FlightTariff
from app.models.route import Route
from app.models.tariff import Tariff
from app.models._base_model import NotFoundError
from app.constants.messages import SearchMessages

if TYPE_CHECKING:
    from app.models.flight_tariff import FlightTariff


def get_flight_seat_availability(
    flight_id: int,
    flight_tariff_id: int | None = None,
    session: Session | None = None,
    *,
    flight_tariffs: Iterable['FlightTariff'] | None = None,
) -> dict[int, dict[str, int]]:
    """Calculate seat availability for a flight's tariffs or a specific tariff"""
    from app.models.booking import Booking
    from app.models.booking_hold import BookingHold
    from app.models.booking_flight import BookingFlight
    from app.utils.enum import BOOKING_STATUS

    session = session or db.session

    active_hold_exists = session.query(BookingHold.id).filter(
        BookingHold.booking_id == Booking.id,
        BookingHold.expires_at != None,
        BookingHold.expires_at > func.now(),
    ).exists()

    taken_rows = (
        session.query(
            BookingFlight.flight_tariff_id.label('flight_tariff_id'),
            func.coalesce(func.sum(BookingFlight.seats_number), 0).label('taken'),
        )
        .join(Booking, BookingFlight.booking_id == Booking.id)
        .join(FlightTariff, FlightTariff.id == BookingFlight.flight_tariff_id)
        .filter(
            FlightTariff.flight_id == flight_id,
            (BookingFlight.flight_tariff_id == flight_tariff_id if flight_tariff_id is not None else true()),
            or_(
                Booking.status == BOOKING_STATUS.completed,
                and_(
                    ~Booking.status.in_(
                        [BOOKING_STATUS.expired, BOOKING_STATUS.cancelled]
                    ),
                    active_hold_exists,
                ),
            ),
        )
        .group_by(BookingFlight.flight_tariff_id)
        .all()
    )

    taken_map = {row.flight_tariff_id: int(row.taken or 0) for row in taken_rows}

    if flight_tariffs is None:
        flight_tariffs = (
            session.query(FlightTariff)
            .filter(FlightTariff.flight_id == flight_id)
            .all()
        )

    availability: dict[int, dict[str, int]] = {}
    for ft in flight_tariffs:
        total = int(ft.seats_number or 0)
        taken = taken_map.get(ft.id, 0)
        available = max(total - taken, 0)
        availability[ft.id] = {
            'tariff_id': ft.tariff_id,
            'total': total,
            'taken': taken,
            'available': available,
        }

    return availability


def get_route_airports(origin_code: str | None, dest_code: str | None) -> tuple[Airport, Airport]:
    """Return airport models for the supplied IATA codes"""

    origin = Airport.get_by_code(origin_code)
    dest = Airport.get_by_code(dest_code)

    if not origin or not dest:
        raise NotFoundError(SearchMessages.UNKNOWN_ORIGIN_OR_DESTINATION)

    return origin, dest


def get_available_tariffs(flight_id: int) -> list[dict[str, Any]]:
    """Return list of available tariffs for a flight ordered by price"""

    tariff_query = (
        db.session.query(FlightTariff, Tariff)
        .join(Tariff, FlightTariff.tariff_id == Tariff.id)
        .filter(FlightTariff.flight_id == flight_id)
    )

    flight_tariffs = [ft for ft, _ in tariff_query.all()]
    availability_map = get_flight_seat_availability(
        flight_id,
        session=db.session,
        flight_tariffs=flight_tariffs,
    )

    result: list[dict[str, Any]] = []
    for flight_tariff, tariff in tariff_query:
        availability = availability_map.get(flight_tariff.id, {})
        seats_left = availability.get('available', 0)

        if seats_left <= 0 or tariff.price is None:
            continue

        result.append(
            {
                'id': tariff.id,
                'flight_tariff_id': flight_tariff.id,
                'seat_class': tariff.seat_class.value,
                'title': tariff.title,
                'price': tariff.price,
                'currency': tariff.currency.value,
                'conditions': tariff.conditions,
                'baggage': tariff.baggage,
                'hand_luggage': tariff.hand_luggage,
                'seats_left': seats_left,
            }
        )

    return sorted(result, key=lambda x: x['price'])


def query_flights(
    *,
    origin_code: str | None,
    dest_code: str | None,
    date_from: date | str | None = None,
    date_to: date | str | None = None,
    airline_iata_code: str | None = None,
    flight_number: str | None = None,
    is_exact: bool = True,
    seat_class: str | None = None,
    seats_number: int = 0,
    direction: str | None = None,
) -> list[dict[str, Any]]:
    """Query flights with applied filters returning serialized dictionaries"""

    origin = aliased(Airport)
    dest = aliased(Airport)

    query = (
        db.session.query(Flight)
        .join(Route, Flight.route_id == Route.id)
        .join(origin, Route.origin_airport_id == origin.id)
        .join(dest, Route.destination_airport_id == dest.id)
    )

    if origin_code:
        query = query.filter(origin.iata_code == origin_code)
    if dest_code:
        query = query.filter(dest.iata_code == dest_code)
    if airline_iata_code and flight_number:
        query = query.join(Airline, Flight.airline_id == Airline.id)
        query = query.filter(
            Airline.iata_code == airline_iata_code,
            Flight.flight_number == flight_number,
        )

    today = func.current_date()
    if is_exact:
        if date_from:
            query = query.filter(
                Flight.scheduled_departure == date_from,
                Flight.scheduled_departure >= today,
            )
        else:
            query = query.filter(false())
    else:
        if date_from and date_to:
            query = query.filter(
                Flight.scheduled_departure.between(date_from, date_to),
                Flight.scheduled_departure >= today,
            )
        elif date_from:
            query = query.filter(
                Flight.scheduled_departure >= date_from,
                Flight.scheduled_departure >= today,
            )
        else:
            query = query.filter(false())

    flights = query.all()

    results: list[dict[str, Any]] = []
    for flight in flights:
        flight_dict = flight.to_dict(return_children=True)
        all_tariffs = get_available_tariffs(flight.id)
        if not all_tariffs:
            continue

        tariff = None
        min_tariff = None

        if seat_class and seats_number > 0:
            seat_class_tariffs = [
                t for t in all_tariffs if t['seat_class'] == seat_class]
            seat_num_tariffs = [
                t for t in seat_class_tariffs if t['seats_left'] >= seats_number]

            if not seat_class_tariffs:
                continue
            if not seat_num_tariffs:
                min_tariff = min(seat_class_tariffs, key=lambda x: x['price'])
            elif len(seat_num_tariffs) > 1:
                min_tariff = min(seat_num_tariffs, key=lambda x: x['price'])
            else:
                tariff = seat_num_tariffs[0]
        else:
            min_tariff = min(all_tariffs, key=lambda x: x['price'])

        if tariff is not None:
            flight_dict['price'] = tariff['price']
            flight_dict['currency'] = tariff['currency']

        if min_tariff is not None:
            flight_dict['min_price'] = min_tariff['price']
            flight_dict['currency'] = min_tariff['currency']

        total_seats_left = sum(t['seats_left'] for t in all_tariffs)
        flight_dict['seats_left'] = total_seats_left

        if direction:
            flight_dict['direction'] = direction

        flight_dict['tariffs'] = all_tariffs
        results.append(flight_dict)

    return results


def build_schedule(origin_code: str, dest_code: str, include_return: bool = True) -> list[dict[str, Any]]:
    """Return schedule flights for both directions for a date"""

    today = date.today()

    flights: list[dict[str, Any]] = []

    flights.extend(
        query_flights(
            origin_code=origin_code,
            dest_code=dest_code,
            date_from=today,
            is_exact=False,
            direction='outbound',
        )
    )

    if include_return:
        flights.extend(
            query_flights(
                origin_code=dest_code,
                dest_code=origin_code,
                date_from=today,
                is_exact=False,
                direction='return',
            )
        )

    return flights


def upcoming_routes(limit: int | None = None) -> Iterable[tuple[str, str]]:
    """Return origin/destination IATA pairs that have upcoming flights"""

    origin = aliased(Airport)
    dest = aliased(Airport)

    query = (
        db.session.query(origin.iata_code, dest.iata_code)
        .select_from(Flight)
        .join(Route, Flight.route_id == Route.id)
        .join(origin, Route.origin_airport_id == origin.id)
        .join(dest, Route.destination_airport_id == dest.id)
        .filter(Flight.scheduled_departure >= func.current_date())
        .group_by(origin.iata_code, dest.iata_code)
        .order_by(func.min(Flight.scheduled_departure))
    )

    if limit is not None:
        query = query.limit(limit)

    rows = query.all()

    return [(row[0], row[1]) for row in rows]
