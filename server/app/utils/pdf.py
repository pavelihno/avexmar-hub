from io import BytesIO

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


def _escape(text: str) -> str:
    return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def _build_pdf(lines: list[str]) -> bytes:
    buffer = BytesIO()
    buffer.write(b'%PDF-1.4\n')
    offsets = []

    def _obj(data: bytes):
        offsets.append(buffer.tell())
        buffer.write(data)

    _obj(b'1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n')
    _obj(b'2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n')
    _obj(
        b'3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
        b'/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n'
    )
    _obj(b'4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n')

    content_parts = ['BT /F1 12 Tf 0 16 TL 40 800 Td']
    for line in lines:
        content_parts.append(f'({_escape(line)}) Tj T*')
    content_parts.append('ET')
    content_stream = '\n'.join(content_parts).encode('utf-8')
    _obj(
        f'5 0 obj << /Length {len(content_stream)} >> stream\n'.encode('utf-8')
        + content_stream
        + b'\nendstream\nendobj\n'
    )

    xref_pos = buffer.tell()
    buffer.write(b'xref\n0 6\n0000000000 65535 f \n')
    for off in offsets:
        buffer.write(f'{off:010} 00000 n \n'.encode('latin-1'))
    buffer.write(b'trailer << /Size 6 /Root 1 0 R >>\nstartxref\n')
    buffer.write(str(xref_pos).encode('latin-1'))
    buffer.write(b'\n%%EOF')
    return buffer.getvalue()


def generate_booking_pdf(booking, *, details=None):
    details = details or get_booking_details(booking)

    status_label = 'Завершено'
    if booking.status == BOOKING_STATUS.cancelled:
        status_label = 'Отменено'

    lines = [f'Бронирование № {booking.booking_number} - {status_label}', '']

    buyer_name = ' '.join(
        filter(None, [details.get('buyer_last_name'), details.get('buyer_first_name')])
    ).strip()
    lines.append('Покупатель:')
    if buyer_name:
        lines.append(f'  {buyer_name}')
    if details.get('email_address'):
        lines.append(f"  Email: {details['email_address']}")
    if details.get('phone_number'):
        lines.append(f"  Телефон: {details['phone_number']}")
    lines.append('')

    flights = details.get('flights') or []
    if flights:
        lines.append('Рейсы:')
        lines.append('№ | Откуда → Куда | Вылет | Прилёт')
        for f in flights:
            route = f.get('route') or {}
            origin = (route.get('origin_airport') or {})
            dest = (route.get('destination_airport') or {})
            origin_str = f"{origin.get('city_name')} ({origin.get('iata_code')})"
            dest_str = f"{dest.get('city_name')} ({dest.get('iata_code')})"
            dep = f"{f.get('scheduled_departure')} {f.get('scheduled_departure_time') or ''}".strip()
            arr = f"{f.get('scheduled_arrival')} {f.get('scheduled_arrival_time') or ''}".strip()
            lines.append(
                f"{f.get('airline_flight_number')} | {origin_str} → {dest_str} | {dep} | {arr}"
            )
        lines.append('')

    passengers = details.get('passengers') or []
    if passengers:
        lines.append('Пассажиры:')
        lines.append('ФИО | Категория | Пол | Дата рождения | Документ | Гражданство')
        for p in passengers:
            full_name = ' '.join(
                filter(None, [p.get('last_name'), p.get('first_name'), p.get('patronymic_name')])
            ).strip()
            cat = CATEGORY_LABELS.get(p.get('category'), p.get('category'))
            gender = GENDER_LABELS.get(p.get('gender'), p.get('gender'))
            doc_type = DOCUMENT_LABELS.get(p.get('document_type'), p.get('document_type'))
            doc = f"{doc_type} {p.get('document_number')}"
            country = (p.get('citizenship') or {}).get('country_name', '')
            lines.append(
                f"{full_name} | {cat} | {gender} | {p.get('birth_date')} | {doc} | {country}"
            )
        lines.append('')

    price = details.get('price_details') or {}
    currency = (details.get('currency') or booking.currency.value).upper()
    if price:
        for direction in price.get('directions', []):
            route = direction.get('route') or {}
            origin = (route.get('origin_airport') or {}).get('city_name', '')
            dest = (route.get('destination_airport') or {}).get('city_name', '')
            lines.append(f'Стоимость: {origin} → {dest}')
            lines.append('Категория | Кол-во | Итоговая цена')
            for p in direction.get('passengers', []):
                cat = CATEGORY_LABELS.get(p.get('category'), p.get('category'))
                lines.append(
                    f"{cat} | {p.get('count')} | {p.get('final_price', 0):.2f} {currency}"
                )
            lines.append('')
        lines.append('Итоговая стоимость:')
        lines.append(f"Тариф | {price.get('fare_price', 0):.2f} {currency}")
        lines.append(f"Сборы | {price.get('total_fees', 0):.2f} {currency}")
        lines.append(f"Скидки | {price.get('total_discounts', 0):.2f} {currency}")
        lines.append(f"Итого | {price.get('final_price', 0):.2f} {currency}")
        lines.append('')

    payment = details.get('payment')
    if payment:
        status = PAYMENT_STATUS_LABELS.get(
            payment.get('payment_status'), payment.get('payment_status')
        )
        method = PAYMENT_METHOD_LABELS.get(
            payment.get('payment_method'), payment.get('payment_method')
        )
        amount = payment.get('amount')
        pay_currency = (payment.get('currency') or currency).upper()
        lines.append('Платёж:')
        lines.append(f'Статус: {status}')
        lines.append(f'Метод: {method}')
        if amount is not None:
            lines.append(f"Сумма: {float(amount):.2f} {pay_currency}")
        if payment.get('paid_at'):
            lines.append(f"Оплачен: {payment['paid_at']}")
        lines.append('')

    return _build_pdf(lines)
