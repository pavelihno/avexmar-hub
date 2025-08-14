from app.config import Config
from app.models.tariff import Tariff
from app.models.flight_tariff import FlightTariff
from app.models.fee import Fee
from app.models.discount import Discount
from app.models.flight import Flight


def get_seats_number(params):
    return (
        int(params.get('adults', 0)) +
        int(params.get('children', 0)) +
        int(params.get('infants_seat', 0))
    )


def calculate_price_details(outbound_id, return_id, tariff_id, passengers):
    tariff = Tariff.get_or_404(tariff_id)
    FlightTariff.query.filter_by(
        flight_id=outbound_id, tariff_id=tariff_id
    ).first_or_404()
    is_round_trip = bool(return_id)
    if is_round_trip:
        FlightTariff.query.filter_by(
            flight_id=return_id, tariff_id=tariff_id
        ).first_or_404()

    passengers = passengers or {}
    categories = ['adults', 'children', 'infants', 'infants_seat']
    passengers = {cat: int(passengers.get(cat, 0) or 0) for cat in categories}

    discounts = Discount.get_all()
    discount_pct = {
        d.discount_type.value: d.percentage_value / 100.0 for d in discounts
    }
    discount_names_map = {
        d.discount_type.value: d.discount_name for d in discounts
    }

    legs = [('outbound', outbound_id)]
    if is_round_trip:
        legs.append(('return', return_id))

    fare_total_price = 0.0
    total_discounts = 0.0
    total_price = 0.0
    tariff_info = {
        'id': tariff.id,
        'title': tariff.title,
        'seat_class': tariff.seat_class.value,
        'price': tariff.price,
        'currency': tariff.currency.value,
        'conditions': tariff.conditions,
    }
    directions = []

    for leg_key, flight_id in legs:
        leg_breakdown = []
        for category, count in passengers.items():
            if not count:
                continue

            fare_total = tariff.price * count
            multiplier = 1.0
            applied_discounts = []

            if tariff.seat_class.value == 'economy':
                if category == 'infants':
                    pct = discount_pct.get('infant', 0.0)
                    multiplier *= (1.0 - pct)
                    if 'infant' in discount_names_map:
                        applied_discounts.append(discount_names_map['infant'])
                elif category == 'children':
                    pct = discount_pct.get('child', 0.0)
                    multiplier *= (1.0 - pct)
                    if 'child' in discount_names_map:
                        applied_discounts.append(discount_names_map['child'])

                if is_round_trip:
                    pct_rt = discount_pct.get('round_trip', 0.0)
                    multiplier *= (1.0 - pct_rt)
                    if 'round_trip' in discount_names_map:
                        applied_discounts.append(
                            discount_names_map['round_trip']
                        )

            total_cost = fare_total * multiplier
            discount_amount = fare_total - total_cost
            discount_label = ', '.join(
                applied_discounts
            ) if applied_discounts else None

            leg_breakdown.append({
                'category': category,
                'count': count,
                'fare_price': fare_total,
                'discount': discount_amount,
                'total_price': total_cost,
                'discount_name': discount_label,
            })
            fare_total_price += fare_total
            total_discounts += discount_amount
            total_price += total_cost

        directions.append({
            'direction': leg_key,
            'flight_id': flight_id,
            'route_id': Flight.get_or_404(flight_id).route_id,
            'tariff': tariff_info,
            'passengers': leg_breakdown,
        })

    seats_number = get_seats_number(passengers) * (2 if is_round_trip else 1)
    fees, fees_total = Fee.calculate_fees(
        seats_number=seats_number,
        application=Config.FEE_APPLICATION.booking,
    )
    total_price += fees_total

    return {
        'tariff': tariff_info,
        'currency': tariff.currency.value,
        'directions': directions,
        'fees': fees,
        'fare_price': fare_total_price,
        'total_discounts': total_discounts,
        'total_price': total_price,
    }
