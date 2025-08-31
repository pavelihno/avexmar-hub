from weasyprint import HTML

from flask import current_app, render_template

from app.utils.business_logic import get_booking_details
from app.utils.enum import BOOKING_STATUS


CATEGORY_LABELS = {
    'adult': 'Взрослый',
    'child': 'Ребёнок',
    'infant': 'Младенец',
    'infant_seat': 'Младенец с местом',
}

DOCUMENT_LABELS = {
    'passport': 'Паспорт',
    'foreign_passport': 'Загранпаспорт',
    'international_passport': 'Загранпаспорт',
    'birth_certificate': 'Свидетельство о рождении',
}

GENDER_LABELS = {'male': 'М', 'female': 'Ж'}

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

    status_label = 'Завершено'
    if booking.status == BOOKING_STATUS.cancelled:
        status_label = 'Отменено'


    context = {
        'booking': booking,
        'details': details,
        'status_label': status_label,
        'category_labels': CATEGORY_LABELS,
        'document_labels': DOCUMENT_LABELS,
        'gender_labels': GENDER_LABELS,
        'payment_status_labels': PAYMENT_STATUS_LABELS,
        'payment_method_labels': PAYMENT_METHOD_LABELS,
        'brand_name': 'АВЕКСМАР',
        'site_url': 'https://avexmar.ru',
        'support_email': 'mail@avexmar.com',
    }

    html = render_template('booking/pdf.html', **context)
    pdf = HTML(string=html, base_url=current_app.root_path).write_pdf()
    return pdf

