from datetime import datetime
from sqlalchemy.orm import joinedload

from app.utils.enum import (
    PASSENGER_PLURAL_CATEGORY,
    FEE_APPLICATION,
    CONSENT_ACTION,
    CONSENT_EVENT_TYPE,
)
from app.utils.passenger_categories import (
    PASSENGER_WITH_SEAT_CATEGORIES,
    get_category_discount_multiplier,
)
from app.utils.datetime import combine_date_time
from app.models.flight_tariff import FlightTariff
from app.models.fee import Fee
from app.models.discount import Discount
from app.models.flight import Flight
from app.models.booking_passenger import BookingPassenger
from app.models.booking_flight import BookingFlight
from app.models.booking_flight_passenger import BookingFlightPassenger
from app.models.payment import Payment


def get_seats_number(params):
    return sum(
        int(params.get(BookingPassenger.get_plural_category(cat).value, 0))
        for cat in PASSENGER_WITH_SEAT_CATEGORIES
    )


def __get_passenger_full_name(last_name, first_name, patronymic_name) -> str:
    return ' '.join(
        filter(
            None,
            [last_name, first_name, patronymic_name],
        )
    ).strip()


def get_all_discounts():
    discounts = Discount.get_all()
    discount_pct = {
        d.discount_type.value: d.percentage_value / 100.0 for d in discounts
    }
    discount_names_map = {
        d.discount_type.value: d.discount_name for d in discounts
    }

    return discount_pct, discount_names_map


def calculate_price_per_passenger(tariff, category, is_round_trip, discount_pct=None, discount_names_map=None):

    if discount_pct is None or discount_names_map is None:
        discount_pct, discount_names_map = get_all_discounts()

    tariff_multiplier, applied_discounts = get_category_discount_multiplier(
        category,
        tariff.seat_class,
        is_round_trip,
        discount_pct,
        discount_names_map,
    )

    unit_fare_price = tariff.price
    unit_price = unit_fare_price * tariff_multiplier
    unit_discount = unit_fare_price - unit_price
    discount_name = ', '.join(applied_discounts) if applied_discounts else None

    return {
        'tariff_multiplier': tariff_multiplier,
        'applied_discounts': applied_discounts,
        'discount_name': discount_name,
        'unit_fare_price': unit_fare_price,
        'unit_price': unit_price,
        'unit_discount': unit_discount,
    }


def calculate_price_details(outbound_id, outbound_tariff_id, return_id, return_tariff_id, passenger_counts):
    legs = []

    if outbound_id and outbound_tariff_id:
        outbound_ft = FlightTariff.query.filter_by(
            flight_id=outbound_id,
            tariff_id=outbound_tariff_id,
        ).first_or_404()
        legs.append(('outbound', outbound_ft))

    if return_id and return_tariff_id:
        return_ft = FlightTariff.query.filter_by(
            flight_id=return_id,
            tariff_id=return_tariff_id,
        ).first_or_404()
        legs.append(('return', return_ft))

    is_round_trip = len(legs) > 1

    passenger_counts = passenger_counts or {}
    passenger_counts = {
        cat.value: int(passenger_counts.get(cat.value, 0))
        for cat in PASSENGER_PLURAL_CATEGORY
    }

    discount_pct, discount_names_map = get_all_discounts()
    service_fees = Fee.get_applicable_fees(FEE_APPLICATION.service_fee)

    currency = legs[0][1].tariff.currency.value
    fare_price = 0.0
    discount = 0.0
    final_price = 0.0

    fees = {}

    directions = []

    for leg_key, flight_tariff in legs:
        leg_passengers = []
        flight = flight_tariff.flight or Flight.get_or_404(
            flight_tariff.flight_id
        )
        tariff = flight_tariff.tariff

        for category_value, passenger_number in passenger_counts.items():
            category = BookingPassenger.get_category_from_plural(
                PASSENGER_PLURAL_CATEGORY(category_value)
            )
            if category is None:
                continue

            seats_number = passenger_number \
                if category in PASSENGER_WITH_SEAT_CATEGORIES \
                else 0

            if not passenger_number:
                continue

            price_per_passenger_data = calculate_price_per_passenger(
                tariff,
                category,
                is_round_trip,
                discount_pct,
                discount_names_map,
            )

            discount_name = price_per_passenger_data['discount_name']
            unit_fare_price = price_per_passenger_data['unit_fare_price']
            unit_price = price_per_passenger_data['unit_price']
            unit_discount = price_per_passenger_data['unit_discount']
            unit_fees = 0.0

            # Price for all passengers of the category
            _fare_price = unit_fare_price * passenger_number
            _discount = unit_discount * passenger_number
            _price = unit_price * passenger_number
            _fees = 0.0

            # Fees calculation
            for fee in service_fees:
                fee_id = fee.id

                # Fee per one seat
                _unit_fee = fee.amount
                unit_fees += _unit_fee

                # Fee for all seats of the category
                fee_amount = _unit_fee * passenger_number
                _fees += fee_amount

                if fee_id in fees:
                    fees[fee_id]['total'] += fee_amount
                else:
                    fees[fee_id] = {'name': fee.name, 'total': fee_amount}

            _unit_final_price = unit_price + unit_fees
            _final_price = _price + _fees

            fare_price += _fare_price
            discount += _discount
            final_price += _final_price

            leg_passengers.append({
                'category': category_value,
                'count': passenger_number,
                'fare_price': _fare_price,
                'discount': _discount,
                'fees': _fees,
                'price': _price,
                'final_price': _final_price,
                'unit_fare_price': unit_fare_price,
                'unit_discount': unit_discount,
                'unit_fees': unit_fees,
                'unit_final_price': _unit_final_price,
                'discount_name': discount_name,
            })

        directions.append({
            'direction': leg_key,
            'flight_id': flight.id if flight else flight_tariff.flight_id,
            'flight_tariff_id': flight_tariff.id,
            'route': flight.route.to_dict(return_children=True),
            'tariff': {
                'id': tariff.id,
                'title': tariff.title,
                'seat_class': tariff.seat_class.value,
                'price': tariff.price,
                'currency': tariff.currency.value,
                'conditions': tariff.conditions,
                'baggage': tariff.baggage,
                'hand_luggage': tariff.hand_luggage,
            },
            'passengers': leg_passengers,
        })

    fees = [f for f in fees.values()]

    return {
        'currency': currency,
        'directions': directions,
        'fees': fees,
        'fare_price': fare_price,
        'total_fees': sum(f['total'] for f in fees),
        'total_discounts': discount,
        'final_price': final_price,
    }


def calculate_receipt_details(booking):
    """Prepare detailed data for fiscal receipt items"""
    flights = booking.booking_flights.order_by(BookingFlight.id).all()
    outbound_ft = flights[0].flight_tariff if len(flights) > 0 else None
    return_ft = flights[1].flight_tariff if len(flights) > 1 else None

    price_details = calculate_price_details(
        outbound_ft.flight_id if outbound_ft else None,
        outbound_ft.tariff_id if outbound_ft else None,
        return_ft.flight_id if return_ft else None,
        return_ft.tariff_id if return_ft else None,
        booking.passenger_counts or {},
    )

    passengers_map = {}
    for bp in booking.booking_passengers.order_by(BookingPassenger.id).all():
        passenger = bp.get_passenger_details()
        passengers_map.setdefault(
            BookingPassenger.get_plural_category(bp.category).value,
            []
        ).append({
            'last_name': passenger.get('last_name'),
            'first_name': passenger.get('first_name'),
            'patronymic_name': passenger.get('patronymic_name')
        })

    directions = []
    for direction in price_details.get('directions', []):
        flight = Flight.get_or_404(direction.get('flight_id'))
        seat_class = direction.get('tariff', {}).get('seat_class')
        route = direction.get('route')
        date = flight.scheduled_departure if flight else None
        dir_passengers = []

        for p in direction.get('passengers', []):
            passengers = passengers_map.get(p['category'], [])
            unit_final_price = p.get('unit_final_price', 0.0)
            for passenger in passengers:
                full_name = __get_passenger_full_name(
                    passenger.get('last_name'),
                    passenger.get('first_name'),
                    passenger.get('patronymic_name')
                )
                dir_passengers.append(
                    {
                        **passenger,
                        'full_name': full_name,
                        'price': unit_final_price
                    }
                )

        directions.append({
            'route': route,
            'seat_class': seat_class,
            'date': date,
            'passengers': dir_passengers,
        })

    return {
        'currency': price_details.get('currency'),
        'directions': directions,
    }


def _extract_passengers_data(booking):
    """Extract and normalize passenger data from booking"""
    passengers = []
    for bp in booking.booking_passengers:
        p = bp.get_passenger_details()
        p['category'] = bp.category.value if bp.category else None
        passengers.append(p)

    passengers_exist = len(passengers) > 0
    if not passengers:
        counts = booking.passenger_counts or {}
        for key, count in counts.items():
            try:
                count = int(count)
            except (TypeError, ValueError):
                continue
            category = BookingPassenger.get_category_from_plural(
                PASSENGER_PLURAL_CATEGORY(key)
            )
            for _ in range(count):
                passengers.append({'category': category.value})

    return passengers, passengers_exist


def _extract_flights_tariffs(booking):
    """Extract flights and tariff mappings from booking"""
    flight_pairs = []
    for bf in booking.booking_flights.all():
        ft = bf.flight_tariff
        if ft and ft.flight:
            flight_dict = ft.flight.to_dict(return_children=True)
            flight_pairs.append((bf, flight_dict))

    flight_pairs.sort(
        key=lambda pair: (
            pair[1].get('scheduled_departure'),
            pair[1].get('scheduled_departure_time') or '',
        )
    )

    booking_flights = [pair[0] for pair in flight_pairs]
    flights = [pair[1] for pair in flight_pairs]

    tariffs_map = {}
    for bf in booking_flights:
        ft = bf.flight_tariff
        if ft:
            tariffs_map[ft.flight_id] = {
                'tariff_id': ft.tariff_id,
                'flight_tariff_id': ft.id,
            }

    outbound_id = flights[0]['id'] if len(flights) > 0 else 0
    return_id = flights[1]['id'] if len(flights) > 1 else 0
    outbound_tariff = tariffs_map.get(outbound_id, {})
    return_tariff = tariffs_map.get(return_id, {})
    outbound_tariff_id = outbound_tariff.get('tariff_id')
    return_tariff_id = return_tariff.get('tariff_id')

    return flights, booking_flights, outbound_id, outbound_tariff_id, return_id, return_tariff_id


def _extract_payment_data(booking):
    """Extract all the payments related to the booking"""
    payments = booking.payments.order_by(Payment.id.desc()).all()
    return [p.to_dict() for p in payments]


def _check_consent(booking):
    """Check if booking has consent PD agreement"""
    return (
        booking.consent_events.filter_by(
            type=CONSENT_EVENT_TYPE.pd_agreement_acceptance,
            action=CONSENT_ACTION.agree,
        ).count()
        > 0
    )


def build_booking_snapshot(booking) -> dict:
    """Build a reusable snapshot of booking details for documents and UI"""

    # Extract base data using helper functions
    passengers, passengers_exist = _extract_passengers_data(booking)
    flights, booking_flights, outbound_id, outbound_tariff_id, return_id, return_tariff_id = _extract_flights_tariffs(
        booking
    )
    payments = _extract_payment_data(booking)
    consent_exists = _check_consent(booking)

    # Calculate price details
    passenger_counts = dict(booking.passenger_counts or {})
    price_details = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
        passenger_counts,
    )

    # Transform passengers to snapshot format
    passengers_details = []
    for p in passengers:
        citizenship = p.get('citizenship', {})
        passengers_details.append({
            'id': p.get('id'),
            'first_name': p.get('first_name'),
            'last_name': p.get('last_name'),
            'patronymic_name': p.get('patronymic_name'),
            'gender': p.get('gender'),
            'birth_date': p.get('birth_date'),
            'document_type': p.get('document_type'),
            'document_number': p.get('document_number'),
            'document_expiry_date': p.get('document_expiry_date'),
            'citizenship': {'name': citizenship.get('name'), 'code_a3': citizenship.get('code_a3')},
            'citizenship_id': citizenship.get('id'),
            'category': p.get('category'),
        })

    # Transform flights to snapshot format
    flights_details = []
    for i, f in enumerate(flights):
        route = f.get('route', {})
        origin = route.get('origin_airport', {})
        destination = route.get('destination_airport', {})
        airline = f.get('airline', {})
        booking_flight = booking_flights[i]

        flights_details.append({
            'id': f.get('id'),
            'booking_flight_id': booking_flight.id,
            'airline_flight_number': f.get('airline_flight_number'),
            'scheduled_departure': f.get('scheduled_departure'),
            'scheduled_departure_time': f.get('scheduled_departure_time'),
            'scheduled_arrival': f.get('scheduled_arrival'),
            'scheduled_arrival_time': f.get('scheduled_arrival_time'),
            'route': {
                'id': route.get('id'),
                'origin_airport': {
                    'city_name': origin.get('city_name'),
                    'iata_code': origin.get('iata_code'),
                },
                'destination_airport': {
                    'city_name': destination.get('city_name'),
                    'iata_code': destination.get('iata_code'),
                },
            },
            'airline': {
                'name': airline.get('name'),
                'iata_code': airline.get('iata_code'),
            },
        })

    # Build routes and tariffs maps
    routes_map = {f['id']: f['route'] for f in flights_details}
    tariffs_map = {}
    for bf in booking_flights:
        ft = bf.flight_tariff
        if not ft:
            continue
        tariff = ft.tariff
        if tariff:
            tariffs_map[ft.flight_id] = {
                'id': tariff.id,
                'title': tariff.title,
                'seat_class': tariff.seat_class.value if tariff.seat_class else None,
                'hand_luggage': tariff.hand_luggage,
                'baggage': tariff.baggage,
            }

    # Transform price details to snapshot format
    price_directions = []
    for direction in price_details.get('directions', []):
        flight_id = direction.get('flight_id')
        price_directions.append({
            'direction': direction.get('direction'),
            'flight_id': flight_id,
            'route': routes_map.get(flight_id, {}),
            'tariff': tariffs_map.get(flight_id, {}),
            'passengers': [
                {
                    'category': p.get('category'),
                    'count': p.get('count'),
                    'unit_fare_price': p.get('unit_fare_price'),
                    'unit_discount': p.get('unit_discount'),
                    'discount_name': p.get('discount_name'),
                    'price': p.get('price'),
                }
                for p in direction.get('passengers', [])
            ],
        })

    price_details = {
        'currency': price_details.get('currency'),
        'directions': price_directions,
        'fees': [
            {'name': fee.get('name'), 'total': fee.get('total')}
            for fee in price_details.get('fees', [])
        ],
        'fare_price': price_details.get('fare_price'),
        'total_fees': price_details.get('total_fees'),
        'total_discounts': price_details.get('total_discounts'),
        'final_price': price_details.get('final_price'),
    }

    # Transform payment data to snapshot format
    payments_details = []
    for payment in payments:
        payments_details.append({
            'payment_status': payment.get('payment_status'),
            'payment_method': payment.get('payment_method'),
            'payment_type': payment.get('payment_type'),
            'amount': payment.get('amount'),
            'currency': payment.get('currency'),
            'paid_at': payment.get('paid_at'),
            'expires_at': payment.get('expires_at'),
            'provider_payment_id': payment.get('provider_payment_id'),
        })

    # Build final snapshot
    snapshot = {
        **booking.to_dict(),
        'passenger_counts': passenger_counts,
        'passengers_exist': passengers_exist,
        'consent': consent_exists,
        'flights': flights_details,
        'passengers': passengers_details,
        'price_details': price_details,
        'payments': payments_details,
    }

    return snapshot


def get_booking_snapshot(booking) -> dict:
    """Return a stored snapshot if possible, otherwise build a fresh one"""

    snapshot = booking.details_snapshot or {}
    required_keys = {
        'flights',
        'passengers',
        'price_details',
        'payments',
    }

    if not snapshot or any(key not in snapshot for key in required_keys):
        snapshot = build_booking_snapshot(booking)

    # Extend flight details with tickets and itinerary info
    booking_passenger_ids = [
        bp.id for bp in booking.booking_passengers
    ]

    booking_flights = booking.booking_flights.order_by(BookingFlight.id).all()

    flight_to_bf = {
        bf.flight_tariff.flight_id: bf.id for bf in booking_flights
    }
    booking_flight_itinerary = {
        bf.id: bool(bf.itinerary_receipt_path) for bf in booking_flights
    }

    booking_flight_passengers = BookingFlightPassenger.query.options(
        joinedload(BookingFlightPassenger.ticket),
        joinedload(BookingFlightPassenger.booking_passenger).joinedload(
            BookingPassenger.passenger)
    ).filter(
        BookingFlightPassenger.booking_passenger_id.in_(booking_passenger_ids)
    ).all()

    booking_flights_tickets = {}
    for bfp in booking_flight_passengers:
        bf_id = flight_to_bf.get(bfp.flight_id)
        if bf_id is None:
            continue

        if bf_id not in booking_flights_tickets:
            booking_flights_tickets[bf_id] = []

        ticket = bfp.ticket
        passenger_data = bfp.booking_passenger.get_passenger_details() if bfp.booking_passenger else {}
        booking_flights_tickets[bf_id].append({
            'id': ticket.id if ticket else None,
            'ticket_number': ticket.ticket_number if ticket else None,
            'passenger': passenger_data,
            'booking_flight_passenger_id': bfp.id,
            'status': bfp.status.value if bfp.status else None,
            'refund_request_at': bfp.refund_request_at.isoformat() if bfp.refund_request_at else None,
            'refund_decision_at': bfp.refund_decision_at.isoformat() if bfp.refund_decision_at else None,
        })

    snapshot['flights'] = [
        {
            **flight,
            'tickets': booking_flights_tickets.get(flight.get('booking_flight_id'), []),
            'can_download_itinerary': booking_flight_itinerary.get(
                flight.get('booking_flight_id'),
                False,
            ),
        }
        for flight in snapshot.get('flights', [])
    ]

    return snapshot


def calculate_refund_details(booking, ticket):
    """
    Calculate the refund details for a ticket in a booking
    """
    total_refund_amount = 0.0

    bfp = ticket.booking_flight_passenger
    bp = bfp.booking_passenger

    booking_flight_ids = BookingFlight.query.with_entities(BookingFlight.id).filter_by(
        booking_id=booking.id
    ).subquery()

    flight_tariff = FlightTariff.query.join(
        BookingFlight,
        FlightTariff.id == BookingFlight.flight_tariff_id
    ).filter(
        BookingFlight.id.in_(booking_flight_ids),
        FlightTariff.flight_id == bfp.flight_id,
    ).first_or_404()

    tariff = flight_tariff.tariff
    flight = flight_tariff.flight
    route = flight.route
    is_round_trip = booking.booking_flights.count() > 1

    departure_dt = combine_date_time(
        flight.scheduled_departure,
        flight.scheduled_departure_time,
    )

    timestamp = bfp.refund_request_at or datetime.now()

    hours_before_departure = (
        (departure_dt - timestamp).total_seconds() / 3600.0
        if departure_dt
        else 0.0
    )

    is_refundable_tariff = tariff.refund_allowed
    is_refundable_period = hours_before_departure >= 24

    is_refundable = is_refundable_tariff and is_refundable_period

    if not is_refundable:
        return is_refundable, is_refundable_tariff, is_refundable_period, total_refund_amount

    # Calculate refundable amount
    price_details = calculate_price_per_passenger(
        tariff,
        bp.category,
        is_round_trip,
    )

    # Penalty fees
    penalty_fees = Fee.get_applicable_fees(
        FEE_APPLICATION.ticket_refund,
        hours_before_departure=hours_before_departure,
        tariff_id=tariff.id,
    )
    penalty_fee_details = [
        {
            'id': fee.id,
            'name': fee.name,
            'amount': fee.amount,
            'description': fee.description,
            'application_term': fee.application_term.value
            if fee.application_term
            else None,
        }
        for fee in penalty_fees
    ]

    total_penalty_fees = sum(fee['amount'] for fee in penalty_fee_details)
    unit_price = price_details['unit_price']
    total_refund_amount = max(unit_price - total_penalty_fees, 0.0)

    # Passenger details
    passenger = bp.get_passenger_details() if bp else {}
    passenger_details = {
        'full_name': __get_passenger_full_name(
            passenger.get('last_name'),
            passenger.get('first_name'),
            passenger.get('patronymic_name')
        ),
    }

    # Flight details
    origin_airport = route.origin_airport
    destination_airport = route.destination_airport
    flight_details = {
        'flight_number': flight.flight_number,
        'departure_date': flight.scheduled_departure,
        'arrival_date': flight.scheduled_arrival,
        'origin': origin_airport.city_name,
        'destination': destination_airport.city_name,
        'seat_class': tariff.seat_class.value
    }

    # Ticket details
    ticket_details = {
        'ticket_number': ticket.ticket_number,
    }

    refund_details = {
        'unit_price': unit_price,
        'penalty_fees': penalty_fee_details,
        'total_penalty_fees': total_penalty_fees,
        'refund_amount': total_refund_amount,
        'currency': booking.currency.value if booking.currency else None,
        'passenger': passenger_details,
        'flight': flight_details,
        'ticket': ticket_details,
    }

    return (
        is_refundable, is_refundable_tariff, is_refundable_period, refund_details
    )
