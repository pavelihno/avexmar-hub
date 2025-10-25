from datetime import date
from typing import Iterable, Mapping
from urllib.parse import urlencode, urljoin

from app.models.airport import Airport
from app.models._base_model import NotFoundError
from app.utils.search import (
    build_schedule,
    get_route_airports,
    query_flights,
)
from app.utils.business_logic import get_seats_number
from app.constants.messages import SearchMessages
from app.constants.seo import SEOText


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _format_human_date(value: date | None) -> str:
    if not value:
        return ''
    return value.strftime(SEOText.DATE_FORMAT)


def _flight_offers_jsonld(flight: dict) -> list[dict[str, object]]:
    offers = []
    for tariff in flight.get('tariffs', [])[:3]:
        offers.append(
            {
                '@type': 'Offer',
                'name': tariff.get('title'),
                'price': tariff.get('price'),
                'priceCurrency': tariff.get('currency'),
                'availability': SEOText.SCHEMA_IN_STOCK
                if tariff.get('seats_left', 0) > 0
                else SEOText.SCHEMA_SOLD_OUT,
            }
        )
    return offers


def _airport_jsonld(airport: Mapping[str, object] | Airport) -> dict[str, object]:
    if isinstance(airport, Airport):
        airport_dict = {
            'iataCode': airport.iata_code,
            'name': airport.name,
            'address': airport.city_name,
        }
    else:
        airport_dict = {
            'iataCode': airport.get('iata_code'),
            'name': airport.get('name'),
            'address': airport.get('city_name'),
        }
    return {
        '@type': 'Airport',
        **airport_dict,
    }


def _flight_jsonld(flight: dict) -> dict[str, object]:
    route = flight.get('route', {})
    origin = route.get('origin_airport', {})
    dest = route.get('destination_airport', {})

    departure_time = None
    if flight.get('scheduled_departure'):
        departure_time = f"{flight['scheduled_departure']}T{(flight.get('scheduled_departure_time') or SEOText.DEFAULT_TIME)}"
    arrival_time = None
    if flight.get('scheduled_arrival'):
        arrival_time = f"{flight['scheduled_arrival']}T{(flight.get('scheduled_arrival_time') or SEOText.DEFAULT_TIME)}"

    airline = flight.get('airline', {})
    flight_number = flight.get('airline_flight_number') or (
        (airline.get('iata_code') or '') + (flight.get('flight_number') or '')
    )

    return {
        '@type': 'Flight',
        'name': flight_number,
        'flightNumber': flight.get('flight_number'),
        'airline': {
            '@type': 'Airline',
            'name': airline.get('name'),
            'iataCode': airline.get('iata_code'),
        },
        'departureAirport': _airport_jsonld(origin),
        'arrivalAirport': _airport_jsonld(dest),
        'departureTime': departure_time,
        'arrivalTime': arrival_time,
        'offers': _flight_offers_jsonld(flight),
    }


def _jsonld_graph(flights: Iterable[dict]) -> dict[str, object]:
    return {
        '@context': SEOText.SCHEMA_CONTEXT,
        '@graph': [_flight_jsonld(flight) for flight in flights],
    }


def _route_name(origin: Airport, dest: Airport) -> str:
    return f'{origin.city_name}{SEOText.ROUTE_SEPARATOR}{dest.city_name}'


def _canonical(base_url: str, path: str, query: dict[str, str]) -> str:
    return urljoin(base_url, f'{path}?{urlencode(query)}')


def build_seo_schedule_context(
    *,
    origin_code: str,
    dest_code: str,
    when: str | None,
    base_url: str,
) -> dict[str, object]:
    origin, dest = get_route_airports(origin_code, dest_code)
    schedule = build_schedule(origin_code, dest_code, when)

    human_date = _format_human_date(_parse_date(when))
    route_title = _route_name(origin, dest)
    lowest_price = None
    for flight in schedule:
        candidate = flight.get('min_price') or flight.get('price')
        if candidate is None:
            continue
        if lowest_price is None or candidate < lowest_price:
            lowest_price = candidate

    description_parts = [
        SEOText.SCHEDULE_FLIGHTS.format(route_title=route_title)]
    if human_date:
        description_parts.append(SEOText.ON_DATE.format(human_date=human_date))
    if lowest_price is not None:
        description_parts.append(
            SEOText.PRICES_FROM.format(lowest_price=lowest_price))
    description = SEOText.DESCRIPTION_SEPARATOR.join(
        description_parts) + SEOText.DESCRIPTION_END

    canonical = _canonical(
        base_url,
        '/schedule',
        {
            'from': origin_code,
            'to': dest_code,
            **({'when': when} if when else {}),
        },
    )

    return {
        'title': SEOText.SCHEDULE_TITLE.format(route_title=route_title),
        'description': description,
        'canonical': canonical,
        'origin': origin,
        'destination': dest,
        'flights': schedule,
        'structured_data': _jsonld_graph(schedule),
    }


def build_seo_search_context(
    params: Mapping[str, str],
    *,
    base_url: str,
) -> dict[str, object]:
    origin_code = params.get('from')
    dest_code = params.get('to')
    if not origin_code or not dest_code:
        raise NotFoundError(SearchMessages.ORIGIN_AND_DESTINATION_REQUIRED)

    origin, dest = get_route_airports(origin_code, dest_code)

    is_exact = params.get('date_mode') == 'exact'
    seat_class = params.get('class')
    seats_number = get_seats_number(params)

    depart_from = params.get('when') if is_exact else params.get('when_from')
    depart_to = None if is_exact else params.get('when_to')
    airline_code = params.get('outbound_airline')
    flight_number = params.get('outbound_flight')

    flights = query_flights(
        origin_code=origin_code,
        dest_code=dest_code,
        date_from=depart_from,
        date_to=depart_to,
        airline_iata_code=airline_code,
        flight_number=flight_number,
        is_exact=is_exact,
        seat_class=seat_class,
        seats_number=seats_number,
        direction='outbound',
    )

    return_from = params.get('return') if is_exact else params.get('return_from')
    return_to = None if is_exact else params.get('return_to')
    return_airline = params.get('return_airline')
    return_flight_number = params.get('return_flight')

    if return_from:
        flights.extend(
            query_flights(
                origin_code=dest_code,
                dest_code=origin_code,
                date_from=return_from,
                date_to=return_to,
                airline_iata_code=return_airline,
                flight_number=return_flight_number,
                is_exact=is_exact,
                seat_class=seat_class,
                seats_number=seats_number,
                direction='return',
            )
        )

    human_date = _format_human_date(_parse_date(depart_from))
    route_title = _route_name(origin, dest)

    if flights:
        cheapest = min(
            (
                flight.get('min_price')
                or flight.get('price')
                for flight in flights
                if flight.get('min_price') or flight.get('price')
            ),
            default=None,
        )
    else:
        cheapest = None

    description_parts = [
        SEOText.FLIGHT_TICKETS.format(route_title=route_title)]
    if human_date:
        description_parts.append(SEOText.ON_DATE.format(human_date=human_date))
    if cheapest is not None:
        description_parts.append(SEOText.FROM_PRICE.format(cheapest=cheapest))
    description = SEOText.DESCRIPTION_SEPARATOR.join(
        description_parts) + SEOText.DESCRIPTION_END

    canonical_params = {k: v for k, v in params.items() if v}
    canonical = _canonical(base_url, '/search', canonical_params)

    return {
        'title': SEOText.SEARCH_TITLE.format(route_title=route_title),
        'description': description,
        'canonical': canonical,
        'origin': origin,
        'destination': dest,
        'flights': flights,
        'structured_data': _jsonld_graph(flights),
    }
