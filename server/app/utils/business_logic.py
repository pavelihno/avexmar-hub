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
from app.models.tariff import Tariff
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


def calculate_price_details(outbound_id, outbound_tariff_id, return_id, return_tariff_id, passengers):
    legs = []

    if outbound_id and outbound_tariff_id:
        tariff_out = Tariff.get_or_404(outbound_tariff_id)
        FlightTariff.query.filter_by(
            flight_id=outbound_id, tariff_id=outbound_tariff_id
        ).first_or_404()
        legs.append(('outbound', outbound_id, tariff_out))

    if return_id and return_tariff_id:
        tariff_ret = Tariff.get_or_404(return_tariff_id)
        FlightTariff.query.filter_by(
            flight_id=return_id, tariff_id=return_tariff_id
        ).first_or_404()
        legs.append(('return', return_id, tariff_ret))

    is_round_trip = len(legs) > 1

    passengers = passengers or {}
    passengers = {
        cat.value: int(passengers.get(cat.value, 0))
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

    currency = legs[0][2].currency.value
    fare_price = 0.0
    discount = 0.0
    final_price = 0.0

    fees = {}

    directions = []

    for leg_key, flight_id, tariff in legs:
        leg_passengers = []
        flight = Flight.get_or_404(flight_id)

        for category_value, passenger_number in passengers.items():
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
            'flight_id': flight_id,
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
    outbound_id = flights[0].flight_id if len(flights) > 0 else None
    return_id = flights[1].flight_id if len(flights) > 1 else None

    tariffs_map = {bf.flight_id: bf.tariff_id for bf in flights}
    outbound_tariff_id = tariffs_map.get(outbound_id)
    return_tariff_id = tariffs_map.get(return_id)

    price_details = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
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


def get_booking_details(booking) -> dict:
    """Assemble comprehensive booking details for emails and PDFs"""
    result = booking.to_dict()

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

    passenger_counts = dict(booking.passenger_counts or {})

    flights = [
        bf.flight.to_dict(return_children=True) for bf in booking.booking_flights
    ]
    flights.sort(
        key=lambda f: (
            f.get('scheduled_departure'),
            f.get('scheduled_departure_time') or '',
        )
    )

    outbound_id = flights[0]['id'] if len(flights) > 0 else 0
    return_id = flights[1]['id'] if len(flights) > 1 else 0
    tariffs_map = {
        bf.flight_id: bf.tariff_id
        for bf in booking.booking_flights
    }
    outbound_tariff_id = tariffs_map.get(outbound_id)
    return_tariff_id = tariffs_map.get(return_id)

    result['passengers'] = passengers
    result['passengers_exist'] = passengers_exist
    result['flights'] = flights
    result['price_details'] = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
        passenger_counts,
    )

    payment = booking.payments.order_by(Payment.id.desc()).first()
    if payment:
        result['payment'] = payment.to_dict()

    consent_exists = (
        booking.consent_events.filter_by(
            type=CONSENT_EVENT_TYPE.pd_agreement_acceptance,
            action=CONSENT_ACTION.agree,
        ).count()
        > 0
    )
    result['consent'] = consent_exists

    return result


def get_booking_pdf_details(booking) -> dict:
    """Compose a compact snapshot with only the data required for the booking PDF"""

    full_details = get_booking_details(booking)

    passengers = []
    for p in full_details.get('passengers', []):
        citizenship = p.get('citizenship', {})
        passengers.append({
            'first_name': p.get('first_name'),
            'last_name': p.get('last_name'),
            'patronymic_name': p.get('patronymic_name'),
            'gender': p.get('gender'),
            'birth_date': p.get('birth_date'),
            'document_type': p.get('document_type'),
            'document_number': p.get('document_number'),
            'citizenship': {'name': citizenship.get('name')} if citizenship else {},
            'category': p.get('category'),
        })

    flights = []
    for f in full_details.get('flights', []):
        route = f.get('route', {})
        origin = route.get('origin_airport', {})
        destination = route.get('destination_airport', {})
        airline = f.get('airline', {})

        flights.append({
            'id': f.get('id'),
            'airline_flight_number': f.get('airline_flight_number'),
            'scheduled_departure': f.get('scheduled_departure'),
            'scheduled_departure_time': f.get('scheduled_departure_time'),
            'scheduled_arrival': f.get('scheduled_arrival'),
            'scheduled_arrival_time': f.get('scheduled_arrival_time'),
            'route': {
                'origin_airport': {
                    'city_name': origin.get('city_name'),
                    'iata_code': origin.get('iata_code'),
                },
                'destination_airport': {
                    'city_name': destination.get('city_name'),
                    'iata_code': destination.get('iata_code'),
                },
            },
            'airline': {'name': airline.get('name')},
        })

    routes_map = {}
    tariffs_map = {}
    for f in flights:
        routes_map[f['id']] = f['route']

    for bf in booking.booking_flights.order_by(BookingFlight.id).all():
        tariff = bf.tariff
        if tariff:
            tariffs_map[bf.flight_id] = {
                'id': tariff.id,
                'title': tariff.title,
                'seat_class': tariff.seat_class.value if tariff.seat_class else None,
                'hand_luggage': tariff.hand_luggage,
                'baggage': tariff.baggage,
            }

    price_details_full = full_details.get('price_details', {})
    price_directions = []
    for direction in price_details_full.get('directions', []):
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
        'currency': price_details_full.get('currency'),
        'directions': price_directions,
        'fees': [
            {'name': fee.get('name'), 'total': fee.get('total')}
            for fee in price_details_full.get('fees', [])
        ],
        'fare_price': price_details_full.get('fare_price'),
        'total_fees': price_details_full.get('total_fees'),
        'total_discounts': price_details_full.get('total_discounts'),
        'final_price': price_details_full.get('final_price'),
    }

    payment_info = None
    payment_full = full_details.get('payment')
    if payment_full:
        payment_info = {
            'payment_status': payment_full.get('payment_status'),
            'payment_method': payment_full.get('payment_method'),
            'amount': payment_full.get('amount'),
            'currency': payment_full.get('currency'),
            'paid_at': payment_full.get('paid_at'),
            'provider_payment_id': payment_full.get('provider_payment_id'),
        }

    return {
        'buyer_last_name': full_details.get('buyer_last_name'),
        'buyer_first_name': full_details.get('buyer_first_name'),
        'email_address': full_details.get('email_address'),
        'phone_number': full_details.get('phone_number'),
        'currency': full_details.get('currency'),
        'flights': flights,
        'passengers': passengers,
        'price_details': price_details,
        'payment': payment_info,
    }
