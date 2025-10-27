from datetime import date, datetime, timezone
from typing import Iterable, Mapping
from urllib.parse import urlencode, urljoin

from flask import g, render_template
from sqlalchemy import func
from sqlalchemy.orm import aliased

from app.database import db
from app.models.airport import Airport
from app.models.flight import Flight
from app.models.route import Route
from app.utils.search import (
    build_schedule,
    get_route_airports,
)
from app.constants.branding import BRAND_NAME, CURRENCY_LABELS, SEAT_CLASS_LABELS
from app.constants.seo import SEOText
from app.utils.datetime import format_date


def prerender_filename(origin_code: str, dest_code: str) -> str:
    """Generate filename for prerendered schedule page"""
    return SEOText.PRERENDER_FILENAME.format(
        origin_code=origin_code.upper(),
        dest_code=dest_code.upper()
    )


def static_route_cache() -> list[dict]:
    """Cache static routes with full airport information"""
    routes: list[dict] | None = getattr(g, '_static_seo_routes', None)

    if routes is not None:
        return routes

    origin = aliased(Airport)
    dest = aliased(Airport)

    rows = (
        db.session.query(
            func.upper(origin.iata_code).label('origin_code'),
            func.upper(dest.iata_code).label('dest_code'),
            origin.name.label('origin_name'),
            dest.name.label('dest_name'),
            origin.city_name.label('origin_city'),
            dest.city_name.label('dest_city'),
        )
        .select_from(Flight)
        .join(Route, Flight.route_id == Route.id)
        .join(origin, Route.origin_airport_id == origin.id)
        .join(dest, Route.destination_airport_id == dest.id)
        .filter(Flight.scheduled_departure >= func.current_date())
        .group_by(
            origin.iata_code,
            dest.iata_code,
            origin.name,
            dest.name,
            origin.city_name,
            dest.city_name,
        )
        .order_by('origin_code', 'dest_code')
        .all()
    )

    routes = [
        {
            'origin': {
                'name': origin_name or origin_code,
                'code': origin_code,
                'city': origin_city or origin_code,
            },
            'destination': {
                'name': dest_name or dest_code,
                'code': dest_code,
                'city': dest_city or dest_code,
            },
        }
        for origin_code, dest_code, origin_name, dest_name, origin_city, dest_city in rows
        if origin_code and dest_code
    ]

    g._static_seo_routes = routes

    return routes


def get_schedule_static_path(origin_code: str, dest_code: str) -> str:
    """Get URL path for static SEO schedule page"""
    slug = SEOText.SCHEDULE_SLUG.format(
        origin_code=origin_code.lower(),
        dest_code=dest_code.lower()
    )
    return SEOText.SCHEDULE_PATH.format(slug=slug)


def get_schedule_static_url(base_url: str, origin_code: str, dest_code: str) -> str:
    """Get full URL for static SEO schedule page"""
    return urljoin(base_url, get_schedule_static_path(origin_code, dest_code))


def build_navigation_links(base_url: str) -> dict[str, object] | None:
    """Build navigation links for SEO discovery"""
    routes = static_route_cache()
    if not routes:
        return None

    links: list[dict[str, str]] = []
    navigation_items: list[dict[str, object]] = []

    for position, route in enumerate(routes, start=1):
        schedule_url = get_schedule_static_url(
            base_url, route['origin']['code'], route['destination']['code']
        )

        schedule_label = SEOText.NAVIGATION_SCHEDULE_LABEL.format(
            origin_city=route['origin']['city'],
            dest_city=route['destination']['city']
        )

        links.append({'href': schedule_url, 'text': schedule_label})
        navigation_items.append(
            {
                '@type': SEOText.SCHEMA_TYPE_SITE_NAVIGATION,
                'position': position,
                'name': schedule_label,
                'url': schedule_url,
            }
        )

    return {
        'links': links,
        'navigation_jsonld': {
            '@context': SEOText.SCHEMA_CONTEXT,
            '@type': SEOText.SCHEMA_TYPE_ITEM_LIST,
            'itemListElement': navigation_items,
        },
    }


def _flight_offers_jsonld(flight: dict) -> list[dict[str, object]]:
    offers = []
    for tariff in flight.get('tariffs', []):
        if tariff.get('seats_left', 0) > 0:
            offers.append(
                {
                    '@type': SEOText.SCHEMA_TYPE_OFFER,
                    'name': tariff.get('title'),
                    'price': tariff.get('price'),
                    'priceCurrency': tariff.get('currency'),
                    'availability': SEOText.SCHEMA_IN_STOCK
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
        '@type': SEOText.SCHEMA_TYPE_AIRPORT,
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
        '@type': SEOText.SCHEMA_TYPE_FLIGHT,
        'name': flight_number,
        'flightNumber': flight.get('flight_number'),
        'airline': {
            '@type': SEOText.SCHEMA_TYPE_AIRLINE,
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


def _format_float(value: float) -> str:
    return f'{value:,.2f}'.replace(',', ' ')


def build_seo_schedule_context(
    *,
    origin_code: str,
    dest_code: str,
    base_url: str,
) -> dict[str, object]:
    origin, dest = get_route_airports(origin_code, dest_code)
    schedule = build_schedule(origin_code, dest_code, include_return=False)

    route_title = _route_name(origin, dest)
    lowest_price = None
    for flight in schedule:
        candidate = flight.get('min_price') or flight.get('price')
        if candidate is None:
            continue
        if lowest_price is None or candidate < lowest_price:
            lowest_price = candidate

    description_parts = [
        SEOText.SCHEDULE_FLIGHTS.format(route_title=route_title),
        SEOText.ON_DATE.format(date=format_date(date.today()))
    ]
    if lowest_price is not None:
        description_parts.append(
            SEOText.PRICES_FROM.format(
                lowest_price=_format_float(lowest_price))
        )
    description = SEOText.DESCRIPTION_SEPARATOR.join(
        description_parts
    ) + SEOText.DESCRIPTION_END

    canonical = _canonical(
        base_url,
        '/schedule',
        {
            'from': origin_code,
            'to': dest_code,
        },
    )

    return {
        'title': SEOText.SCHEDULE_TITLE.format(route_title=route_title),
        'brand_name': BRAND_NAME,
        'current_year': datetime.now(timezone.utc).year,
        'description': description,
        'canonical': canonical,
        'origin': origin,
        'destination': dest,
        'flights': schedule,
        'structured_data': _jsonld_graph(schedule),
        'seo_discovery_links': build_navigation_links(base_url),
        'currency_labels': CURRENCY_LABELS,
        'seat_class_labels': SEAT_CLASS_LABELS,
        'format_float': _format_float,
    }


def render_schedule(origin_code: str, dest_code: str, base_url: str) -> Mapping[str, object]:
    """Render schedule page for given route"""
    context = build_seo_schedule_context(
        origin_code=origin_code,
        dest_code=dest_code,
        base_url=base_url,
    )
    html = render_template('seo/schedule.html', **context)
    return {
        'context': context,
        'html': html,
    }
