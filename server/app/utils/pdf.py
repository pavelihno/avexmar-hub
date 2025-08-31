from weasyprint import HTML

from flask import current_app, render_template

from app.utils.business_logic import get_booking_details
from app.utils.datetime import format_date, format_time, format_datetime
from app.utils.enum import BOOKING_STATUS


STATUS_LABELS = {
    BOOKING_STATUS.completed: 'Завершено',
    BOOKING_STATUS.cancelled: 'Отменено'
}

PASSENGER_LABELS = {
    'adult': 'Взрослый',
    'child': 'Ребёнок',
    'infant': 'Младенец',
    'infant_seat': 'Младенец с местом',
}

PASSENGERS_LABELS = {
    'adults': 'Взрослые',
    'children': 'Дети',
    'infants': 'Младенцы',
    'infants_seat': 'Младенцы с местом',
}

DOCUMENT_LABELS = {
    'passport': 'Паспорт',
    'foreign_passport': 'Загранпаспорт',
    'international_passport': 'Загранпаспорт',
    'birth_certificate': 'Свидетельство о рождении',
}

GENDER_LABELS = {
    'м': 'М',
    'ж': 'Ж',
}

PAYMENT_STATUS_LABELS = {
    'pending': 'Ожидает',
    'waiting_for_capture': 'Ожидает подтверждения',
    'succeeded': 'Успешно',
    'canceled': 'Отменён',
}

PAYMENT_METHOD_LABELS = {
    'yookassa': 'ЮKassa',
}

def generate_booking_pdf(booking, *, details=None) -> bytes:
    details = details or get_booking_details(booking)

    seat_class_labels = {
        'economy': 'Эконом',
        'business': 'Бизнес',
    }

    directions = (details or {}).get('price_details', {}).get('directions', [])
    direction_tariffs = {
        d.get('direction'): d.get('tariff') for d in directions if isinstance(d, dict)
    }

    context = {
        'booking': booking,
        'details': details,
        'status_labels': STATUS_LABELS,
        'passenger_labels': PASSENGER_LABELS,
        'passengers_labels': PASSENGERS_LABELS,
        'document_labels': DOCUMENT_LABELS,
        'gender_labels': GENDER_LABELS,
        'payment_status_labels': PAYMENT_STATUS_LABELS,
        'payment_method_labels': PAYMENT_METHOD_LABELS,
        'seat_class_labels': seat_class_labels,
        'direction_tariffs': direction_tariffs,
        'format_date': format_date,
        'format_time': format_time,
        'format_datetime': format_datetime,
        'brand_name': 'АВЕКСМАР',
        'site_url': 'https://avexmar.ru',
        'support_email': 'mail@avexmar.com',
    }

    html = render_template('booking/pdf.html', **context)
    pdf = HTML(string=html, base_url=current_app.root_path).write_pdf()
    return pdf
