from weasyprint import HTML

from flask import current_app, render_template

from app.constants.branding import (
    BRAND_FULL_NAME,
    BRAND_NAME,
    CURRENCY_LABELS,
    DOCUMENT_LABELS,
    GENDER_LABELS,
    INN,
    LEGAL_ADDRESS,
    OGRN,
    PAYMENT_METHOD_LABELS,
    PAYMENT_STATUS_LABELS,
    PHONE_NUMBER,
    SEAT_CLASS_LABELS,
    SITE_URL,
    STATUS_LABELS,
    SUPPORT_EMAIL,
)
from app.utils.passenger_categories import (
    PASSENGER_CATEGORY_LABELS,
    PASSENGERS_LABELS,
)
from app.utils.business_logic import get_booking_details
from app.utils.datetime import format_date, format_time, format_datetime
from app.utils.enum import BOOKING_STATUS


STATUS_LABELS_BY_BOOKING_STATUS = {
    BOOKING_STATUS[key]: value
    for key, value in STATUS_LABELS.items()
    if key in BOOKING_STATUS.__members__
}


def generate_booking_pdf(booking) -> bytes:
    details = get_booking_details(booking)

    directions = details.get('price_details', {}).get('directions', [])
    direction_tariffs = {
        d.get('direction'): d.get('tariff') for d in directions if isinstance(d, dict)
    }

    context = {
        'booking': booking,
        'details': details,
        'status_labels': STATUS_LABELS_BY_BOOKING_STATUS,
        'passenger_labels': PASSENGER_CATEGORY_LABELS,
        'passengers_labels': PASSENGERS_LABELS,
        'document_labels': DOCUMENT_LABELS,
        'gender_labels': GENDER_LABELS,
        'payment_status_labels': PAYMENT_STATUS_LABELS,
        'payment_method_labels': PAYMENT_METHOD_LABELS,
        'seat_class_labels': SEAT_CLASS_LABELS,
        'currency_labels': CURRENCY_LABELS,
        'direction_tariffs': direction_tariffs,
        'format_float': lambda v: f'{v:,.2f}'.replace(',', ' '),
        'format_date': format_date,
        'format_time': format_time,
        'format_datetime': format_datetime,
        'brand_name': BRAND_NAME,
        'brand_full_name': BRAND_FULL_NAME,
        'site_url': SITE_URL,
        'support_email': SUPPORT_EMAIL,
        'phone_number': PHONE_NUMBER,
        'legal_address': LEGAL_ADDRESS,
        'inn': INN,
        'ogrn': OGRN,
    }

    html = render_template('pdf/booking.html', **context)
    pdf = HTML(string=html, base_url=current_app.root_path).write_pdf()
    return pdf
