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
    categories = ['adults', 'children', 'infants', 'infants_seat']
    passengers = {cat: int(passengers.get(cat, 0) or 0) for cat in categories}

    discounts = Discount.get_all()
    discount_pct = {
        d.discount_type.value: d.percentage_value / 100.0 for d in discounts
    }
    discount_names_map = {
        d.discount_type.value: d.discount_name for d in discounts
    }

    fare_total_price = 0.0
    total_discounts = 0.0
    total_price = 0.0
    directions = []

    for leg_key, flight_id, tariff in legs:
        tariff_info = {
            'id': tariff.id,
            'title': tariff.title,
            'seat_class': tariff.seat_class.value,
            'price': tariff.price,
            'currency': tariff.currency.value,
            'conditions': tariff.conditions,
        }
        leg_breakdown = []
        for category, count in passengers.items():
            if not count:
                continue

            fare_total = tariff.price * count
            multiplier = 1.0
            applied_discounts = []

            if tariff.seat_class == Config.SEAT_CLASS.economy:
                if category == 'infants':
                    infant_key = Config.DISCOUNT_TYPE.infant.value
                    pct = discount_pct.get(infant_key, 0.0)
                    multiplier *= (1.0 - pct)
                    if infant_key in discount_names_map:
                        applied_discounts.append(discount_names_map[infant_key])
                elif category == 'children':
                    child_key = Config.DISCOUNT_TYPE.child.value
                    pct = discount_pct.get(child_key, 0.0)
                    multiplier *= (1.0 - pct)
                    if child_key in discount_names_map:
                        applied_discounts.append(discount_names_map[child_key])

                if is_round_trip:
                    rt_key = Config.DISCOUNT_TYPE.round_trip.value
                    pct_rt = discount_pct.get(rt_key, 0.0)
                    multiplier *= (1.0 - pct_rt)
                    if rt_key in discount_names_map:
                        applied_discounts.append(
                            discount_names_map[rt_key]
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
            'route': Flight.get_or_404(flight_id).route.to_dict(return_children=True),
            'tariff': tariff_info,
            'passengers': leg_breakdown,
        })

    currency = legs[0][2].currency.value if legs else None

    seats_number = get_seats_number(passengers) * len(legs)
    fees, fees_total = Fee.calculate_fees(
        seats_number=seats_number,
        application=Config.FEE_APPLICATION.booking,
    )
    total_price += fees_total

    return {
        'currency': currency,
        'directions': directions,
        'fees': fees,
        'fare_price': fare_total_price,
        'total_discounts': total_discounts,
        'total_price': total_price,
    }
