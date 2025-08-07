from flask import request, jsonify

from app.models.tariff import Tariff
from app.models.flight_tariff import FlightTariff
from app.models.fee import Fee


def calculate_price():
    data = request.json or {}
    outbound_id = data.get('outbound_id')
    return_id = data.get('return_id')
    tariff_id = data.get('tariff_id')
    passengers = data.get('passengers', {})

    tariff = Tariff.get_or_404(tariff_id)

    legs = 1
    if return_id:
        legs = 2
        FlightTariff.query.filter_by(flight_id=return_id, tariff_id=tariff_id).first_or_404()
    FlightTariff.query.filter_by(flight_id=outbound_id, tariff_id=tariff_id).first_or_404()

    base_price_per_passenger = tariff.price * legs
    breakdown = []
    total_price = 0

    for category, count in passengers.items():
        if not count:
            continue
        base_total = base_price_per_passenger * count
        discounts = []
        multiplier = 1.0
        if tariff.seat_class.value == 'economy':
            if category == 'infants':
                discounts.append({'type': 'infant', 'percentage': 1.0})
            elif category == 'children':
                discounts.append({'type': 'child', 'percentage': 0.5})
            if return_id:
                discounts.append({'type': 'round_trip', 'percentage': 0.25})
        for d in discounts:
            multiplier *= (1 - d['percentage'])
        final = base_total * multiplier
        discount_amount = base_total - final
        breakdown.append({
            'category': category,
            'count': count,
            'base_price': base_total,
            'discount': discount_amount,
            'final_price': final,
        })
        total_price += final

    total_passengers = sum(passengers.values())
    fees_per_passenger = sum(f.amount for f in Fee.get_all())
    fees = fees_per_passenger * total_passengers
    total_price += fees

    response = {
        'tariff': {'id': tariff.id, 'title': tariff.title, 'seat_class': tariff.seat_class.value},
        'currency': tariff.currency.value,
        'breakdown': breakdown,
        'fees': fees,
        'total': total_price,
    }
    return jsonify(response)
