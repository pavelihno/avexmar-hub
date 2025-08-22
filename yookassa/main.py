import os
import uuid
import requests
import dotenv

from datetime import datetime, timedelta
from yookassa import Configuration, Payment as YooPayment, Invoice as YooInvoice


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
    receipt = {
        'customer': {'email': 'test@example.com'},
        'items': [
            {
                'description': 'Test booking',
                'quantity': '1',
                'amount': {'value': f'{total_price:.2f}', 'currency': currency.upper()},
                'vat_code': 7,
                'payment_mode': 'full_payment',
                'payment_subject': 'service',
            }
        ],
    }
    expires_at = datetime.now() + timedelta(hours=1)
    body = {
        'amount': amount,
        'confirmation': {'type': 'embedded'},
        'capture': False,
        'receipt': receipt,
        'metadata': {'public_id': booking_id, 'expires_at': expires_at.isoformat()},
    }

    try:
        payment = YooPayment.create(body, uuid.uuid4())
        token = getattr(getattr(payment, 'confirmation', None), 'confirmation_token', None)
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
    booking_id = '12345'
    total_price = 100
    currency = 'rub'

    amount = {
        'value': f'{total_price:.2f}',
        'currency': currency.upper(),
    }
    cart = {
        'items': [
            {
                'description': 'Test booking',
                'quantity': '1',
                'amount': {'value': f'{total_price:.2f}', 'currency': currency.upper()},
                'vat_code': 7,
                'payment_mode': 'full_payment',
                'payment_subject': 'service',
            }
        ]
    }
    expires_at = datetime.now() + timedelta(days=1)
    body = {
        'amount': amount,
        'cart': cart,
        'due_date': expires_at.isoformat(),
        'metadata': {'public_id': booking_id, 'expires_at': expires_at.isoformat()},
    }

    try:
        invoice = YooInvoice.create(body, uuid.uuid4())
        print('invoice_id:', getattr(invoice, 'id', None))
        print('payment_url:', getattr(invoice, 'payment_url', None))

    except requests.exceptions.ConnectionError as e:
        print('Network/DNS error contacting YooKassa:', e)

    except Exception as e:
        print('Unexpected error:', type(e).__name__, e)
        raise


def capture_invoice():
    invoice_id = '3033b916-000f-5001-8000-117e3f89084e'
    total_price = 100
    currency = 'rub'

    body = {
        'amount': {
            'value': f'{total_price:.2f}',
            'currency': currency.upper(),
        }
    }
    try:
        payment = YooPayment.capture(invoice_id, body)
        print('Invoice captured successfully:', payment)

    except Exception as e:
        print('Unexpected error:', type(e).__name__, e)
        raise


def decline_invoice():
    invoice_id = '3033aee9-000f-5001-8000-146f7e05aba1'

    try:
        payment = YooPayment.cancel(invoice_id)
        print('Invoice declined successfully:', payment)

    except Exception as e:
        print('Unexpected error:', type(e).__name__, e)
        raise


def send_notification():
    provider_id = '303422b0-000f-5000-b000-15cdb5826584'
    event = 'payment.succeeded'

    event_data = {
        'payment.waiting_for_capture': {'status': 'waiting_for_capture', 'paid': True},
        'payment.succeeded': {
            'status': 'succeeded',
            'paid': True,
            'captured_at': datetime.now().isoformat(),
        },
        'payment.canceled': {'status': 'canceled', 'paid': False},
        'invoice.waiting_for_capture': {'status': 'waiting_for_capture', 'paid': True},
        'invoice.paid': {
            'status': 'paid',
            'paid': True,
            'captured_at': datetime.now().isoformat(),
        },
        'invoice.canceled': {'status': 'canceled', 'paid': False},
    }

    info = event_data.get(event, {})
    obj = {
        'id': provider_id,
        'status': info.get('status'),
        'paid': info.get('paid', False),
        'amount': {'value': '2.00', 'currency': 'RUB'},
    }
    if info.get('captured_at'):
        obj['captured_at'] = info['captured_at']

    webhook_data = {'type': 'notification', 'event': event, 'object': obj}

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
