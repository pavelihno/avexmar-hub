import os
import uuid
import requests
import dotenv

from datetime import datetime, timedelta
from yookassa import Configuration, Payment as YooPayment


WEBHOOK_URL = 'http://localhost:8000/webhooks/yookassa'

dotenv.load_dotenv('../.env')

Configuration.account_id = os.environ.get('YOOKASSA_SHOP_ID')
Configuration.secret_key = os.environ.get('YOOKASSA_SECRET_KEY')


def create_payment():
    booking_id = '12345'
    total_price = 100
    currency = 'rub'

    amount = {
        'value': f'{total_price:.2f}',
        'currency': currency.upper(),
    }
    expires_at = datetime.now() + timedelta(hours=1)
    body = {
        'amount': amount,
        'confirmation': {'type': 'embedded'},
        'capture': False,
        'description': f'Payment description',
    }

    try:
        payment = YooPayment.create(body, uuid.uuid4())

        token = getattr(getattr(payment, 'confirmation', None),
                        'confirmation_token', None)

        print('payment_id:', payment.id)
        print('status:', payment.status)
        print('confirmation_token:', token)

    except requests.exceptions.ConnectionError as e:
        print('Network/DNS error contacting YooKassa:', e)

    except Exception as e:
        print('Unexpected error:', type(e).__name__, e)
        raise


def capture_payment():
    payment_id = '3033b916-000f-5001-8000-117e3f89084e'
    total_price = 39500
    currency = 'rub'

    body = {
        'amount': {
            'value': f'{total_price:.2f}',
            'currency': currency.upper(),
        }
    }
    try:
        payment = YooPayment.capture(payment_id, body)

        print('Payment captured successfully:', payment)

    except Exception as e:
        print('Unexpected error:', type(e).__name__, e)
        raise


def decline_payment():
    payment_id = '3033aee9-000f-5001-8000-146f7e05aba1'

    try:
        payment = YooPayment.cancel(payment_id)

        print('Payment declined successfully:', payment)

    except Exception as e:
        print('Unexpected error:', type(e).__name__, e)
        raise


def create_invoice():
    pass


def capture_invoice():
    pass


def decline_invoice():
    pass


def send_notification():
    payment_id = '303422b0-000f-5000-b000-15cdb5826584'
    status = 'succeeded'

    event_map = {
        'succeeded': 'payment.succeeded',
        'canceled': 'payment.canceled',
        'waiting_for_capture': 'payment.waiting_for_capture'
    }

    event = event_map.get(status)

    webhook_data = {
        'type': 'notification',
        'event': event,
        'object': {
            'id': payment_id,
            'status': status,
            'paid': True,
            'amount': {
                'value': '2.00',
                'currency': 'RUB'
            },
            'authorization_details': {
                'rrn': '603668680243',
                'auth_code': '000000',
                'three_d_secure': {
                    'applied': True
                }
            },
            'created_at': '2018-07-10T14:27:54.691Z',
            'description': 'Заказ №72',
            'expires_at': '2018-07-17T14:28:32.484Z',
            'metadata': {},
            'payment_method': {
                'type': 'bank_card',
                'id': '22d6d597-000f-5000-9000-145f6df21d6f',
                'saved': False,
                'card': {
                    'first6': '555555',
                    'last4': '4444',
                    'expiry_month': '07',
                    'expiry_year': '2021',
                    'card_type': 'MasterCard',
                    'issuer_country': 'RU',
                    'issuer_name': 'Sberbank'
                },
                'title': 'Bank card *4444'
            },
            'refundable': False,
            'test': False,
            'id': payment_id,
            'event': event
        }
    }

    try:
        response = requests.post(WEBHOOK_URL, json=webhook_data)
        response.raise_for_status()

        print('Notification sent successfully:', response.json())

    except Exception as e:
        print('Unexpected error:', e)
        raise


if __name__ == '__main__':
    # create_payment()
    # capture_payment()
    # decline_payment()
    send_notification()
