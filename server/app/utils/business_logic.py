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
from app.models.flight_tariff import FlightTariff
from app.models.fee import Fee
from app.models.discount import Discount
from app.models.flight import Flight
from app.models.booking_passenger import BookingPassenger
from app.models.booking_flight import BookingFlight
from app.models.payment import Payment


def get_seats_number(params):
    return sum(
        int(params.get(BookingPassenger.get_plural_category(cat).value, 0))
        for cat in PASSENGER_WITH_SEAT_CATEGORIES
    )


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

    discounts = Discount.get_all()
    discount_pct = {
        d.discount_type.value: d.percentage_value / 100.0 for d in discounts
    }
    discount_names_map = {
        d.discount_type.value: d.discount_name for d in discounts
    }
    applicable_fees = Fee.get_applicable_fees(FEE_APPLICATION.booking)

    currency = legs[0][1].tariff.currency.value
    fare_price = 0.0
    discount = 0.0
    final_price = 0.0

    fees = {}

    directions = []

    for leg_key, flight_tariff in legs:
        leg_passengers = []
        flight = flight_tariff.flight or Flight.get_or_404(flight_tariff.flight_id)
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

            tariff_multiplier, applied_discounts = get_category_discount_multiplier(
                category,
                tariff.seat_class,
                is_round_trip,
                discount_pct,
                discount_names_map,
            )

            # Price/discount/fees per one passenger/seat of the category
            unit_fare_price = tariff.price
            unit_price = unit_fare_price * tariff_multiplier
            unit_discount = unit_fare_price - unit_price
            unit_fees = 0.0

            # Price for all passengers of the category
            _fare_price = unit_fare_price * passenger_number
            _discount = unit_discount * passenger_number
            _price = unit_price * passenger_number
            _fees = 0.0

            discount_name = ', '.join(
                applied_discounts
            ) if applied_discounts else None

            # Fees calculation
            if seats_number > 0:
                for fee in applicable_fees:
                    fee_id = fee.id

                    # Fee per one seat
                    _unit_fee = fee.amount
                    unit_fees += _unit_fee

                    # Fee for all seats of the category
                    fee_amount = _unit_fee * seats_number
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
        passenger = bp.passenger
        full_name = ' '.join(
            filter(
                None,
                [
                    passenger.last_name,
                    passenger.first_name,
                    passenger.patronymic_name
                ]
            )
        )
        passengers_map.setdefault(
            BookingPassenger.get_plural_category(bp.category).value,
            []
        ).append(full_name)

    directions = []
    for direction in price_details.get('directions', []):
        flight = Flight.get_or_404(direction.get('flight_id'))
        seat_class = direction.get('tariff', {}).get('seat_class')
        route = direction.get('route')
        date = flight.scheduled_departure if flight else None
        dir_passengers = []

        for p in direction.get('passengers', []):
            names = passengers_map.get(p['category'], [])
            unit_final_price = p.get('unit_final_price', 0.0)
            for name in names:
                dir_passengers.append(
                    {'full_name': name, 'price': unit_final_price}
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
        p = bp.passenger.to_dict(return_children=True)
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
    booking_flights = list(booking.booking_flights.order_by(BookingFlight.id).all())
    
    flights = []
    for bf in booking_flights:
        ft = bf.flight_tariff
        if ft and ft.flight:
            flights.append(ft.flight.to_dict(return_children=True))
    flights.sort(
        key=lambda f: (
            f.get('scheduled_departure'),
            f.get('scheduled_departure_time') or '',
        )
    )

    tariffs_map = {}
    for bf in booking_flights:
        ft = bf.flight_tariff
        if not ft:
            continue
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
    flights, booking_flights, outbound_id, outbound_tariff_id, return_id, return_tariff_id = _extract_flights_tariffs(booking)
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
    for f in flights:
        route = f.get('route', {})
        origin = route.get('origin_airport', {})
        destination = route.get('destination_airport', {})
        airline = f.get('airline', {})

        flights_details.append({
            'id': f.get('id'),
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
            'amount': payment.get('amount'),
            'currency': payment.get('currency'),
            'paid_at': payment.get('paid_at'),
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

    return snapshot
