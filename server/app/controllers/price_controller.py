from flask import request, jsonify

from app.models.tariff import Tariff
from app.models.flight_tariff import FlightTariff
from app.models.fee import Fee
from app.models.discount import Discount
from app.models.flight import Flight


def calculate_price():
    data = request.json or {}
    outbound_id = data.get('outbound_id')
    return_id = data.get('return_id')
    tariff_id = data.get('tariff_id')
    passengers = data.get('passengers', {})

    # Fetch and validate tariff and flight association
    tariff = Tariff.get_or_404(tariff_id)
    FlightTariff.query.filter_by(flight_id=outbound_id, tariff_id=tariff_id).first_or_404()
    is_round_trip = bool(return_id)
    if is_round_trip:
        FlightTariff.query.filter_by(flight_id=return_id, tariff_id=tariff_id).first_or_404()

    # Preload discounts
    discounts = Discount.get_all()
    discount_pct = {d.discount_type.value: d.percentage_value / 100.0 for d in discounts}
    discount_names_map = {d.discount_type.value: d.discount_name for d in discounts}

    # Prepare legs
    legs = [('outbound', outbound_id)]
    if is_round_trip:
        legs.append(('return', return_id))

    total_price = 0.0
    tariff_info = {
        'id': tariff.id,
        'title': tariff.title,
        'seat_class': tariff.seat_class.value,
    }
    directions = []

    # Price breakdown per leg and passenger category
    for leg_key, flight_id in legs:
        leg_breakdown = []
        for category, count in passengers.items():
            if not count:
                continue

            base_total = tariff.price * count
            multiplier = 1.0
            applied_discounts = []

            # Apply economy-class discounts
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
                        applied_discounts.append(discount_names_map['round_trip'])

            final_price = base_total * multiplier
            discount_amount = base_total - final_price
            discount_label = ', '.join(applied_discounts) if applied_discounts else None

            leg_breakdown.append({
                'category': category,
                'count': count,
                'base_price': base_total,
                'discount': discount_amount,
                'final_price': final_price,
                'discount_name': discount_label,
            })

            total_price += final_price

        directions.append({
            'direction': leg_key,
            'flight_id': flight_id,
            'route_id': Flight.get_by_id(flight_id).route_id,
            'tariff': tariff_info,
            'passengers': leg_breakdown,
        })

    # Calculate fees
    total_passengers = sum(passengers.values())
    fees = []
    for fee in Fee.get_all():
        fee_total = fee.amount * total_passengers
        fees.append({'name': fee.name, 'amount': fee.amount, 'total': fee_total})
        total_price += fee_total

    response = {
        'tariff': tariff_info,
        'currency': tariff.currency.value,
        'directions': directions,
        'fees': fees,
        'total': total_price,
    }
    return jsonify(response)