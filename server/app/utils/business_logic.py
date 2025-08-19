from app.utils.enum import PASSENGER_CATEGORY, PASSENGER_PLURAL_CATEGORY, SEAT_CLASS, DISCOUNT_TYPE, FEE_APPLICATION
from app.models.tariff import Tariff
from app.models.flight_tariff import FlightTariff
from app.models.fee import Fee
from app.models.discount import Discount
from app.models.flight import Flight
from app.models.booking_passenger import BookingPassenger
from app.models.booking_flight import BookingFlight


PASSENGER_WITH_SEAT_CATEGORIES = [
    PASSENGER_CATEGORY.adult,
    PASSENGER_CATEGORY.child,
    PASSENGER_CATEGORY.infant_seat
]


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
            seats_number = passenger_number \
                if category in PASSENGER_WITH_SEAT_CATEGORIES \
                else 0

            if not passenger_number:
                continue

            tariff_multiplier = 1.0
            applied_discounts = []

            # Discounts based on passenger category and tariff
            if category == PASSENGER_CATEGORY.infant:
                infant_key = DISCOUNT_TYPE.infant.value
                pct = discount_pct.get(infant_key, 0.0)
                tariff_multiplier *= (1.0 - pct)
                if infant_key in discount_names_map:
                    applied_discounts.append(
                        discount_names_map[infant_key])
            if tariff.seat_class == SEAT_CLASS.economy:
                if category == PASSENGER_CATEGORY.child:
                    child_key = DISCOUNT_TYPE.child.value
                    pct = discount_pct.get(child_key, 0.0)
                    tariff_multiplier *= (1.0 - pct)
                    if child_key in discount_names_map:
                        applied_discounts.append(discount_names_map[child_key])
                if is_round_trip:
                    rt_key = DISCOUNT_TYPE.round_trip.value
                    pct_rt = discount_pct.get(rt_key, 0.0)
                    tariff_multiplier *= (1.0 - pct_rt)
                    if rt_key in discount_names_map:
                        applied_discounts.append(
                            discount_names_map[rt_key]
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
    """Prepare detailed data for fiscal receipt items."""
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
        full_name = " ".join(
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
