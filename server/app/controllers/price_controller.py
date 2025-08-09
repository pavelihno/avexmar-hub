from flask import request, jsonify

from app.utils.business_logic import calculate_price_details


def calculate_price():
    data = request.json or {}
    outbound_id = data.get('outbound_id')
    return_id = data.get('return_id')
    tariff_id = data.get('tariff_id')
    passengers = data.get('passengers', {})

    result = calculate_price_details(outbound_id, return_id, tariff_id, passengers)
    return jsonify(result)
