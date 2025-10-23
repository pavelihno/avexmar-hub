from app.utils.passenger_categories import (
    PASSENGER_CATEGORY_LABELS,
    PASSENGERS_LABELS,
)

BRAND_NAME = 'Авексмар'
BRAND_FULL_NAME = 'ООО Авексмар'
SUPPORT_EMAIL = 'mail@avexmar.com'
SITE_URL = 'https://avexmar.ru'
PHONE_NUMBER = '+7 495 363-59-11'
LEGAL_ADDRESS = '105082, г. Москва, ул. Бакунинская, д. 69, стр. 1, помещение 1, офис 16'
INN = '9701049956'
OGRN = '1167746881279'

EMAIL_TEMPLATES = {
    'booking_confirmation': 'booking_confirmation',
    'invoice_payment': 'invoice_payment',
    'password_reset': 'forgot_password',
    'account_activation': 'account_activation',
    'two_factor': 'two_factor',
    'password_change': 'password_change',
}

EMAIL_SUBJECTS = {
    'booking_confirmation': 'Бронирование № {booking_number} подтверждено — {brand_name}',
    'invoice_payment': 'Оплата бронирования — {brand_name}',
    'password_reset': 'Сброс пароля — {brand_name}',
    'account_activation': 'Активация аккаунта — {brand_name}',
    'two_factor': 'Код для входа — {brand_name}',
    'password_change': 'Изменение пароля — {brand_name}',
}

DEFAULT_EMAIL_CONTEXT = {
    'brand_name': BRAND_NAME,
    'support_email': SUPPORT_EMAIL,
    'site_url': SITE_URL,
}

STATUS_LABELS = {
    'completed': 'Завершено',
    'cancelled': 'Отменено',
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

SEAT_CLASS_LABELS = {
    'economy': 'Эконом',
    'business': 'Бизнес',
}
