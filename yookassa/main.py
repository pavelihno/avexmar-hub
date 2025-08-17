import os
import uuid
import requests
import dotenv

from datetime import datetime, timedelta
from yookassa import Configuration, Payment as YooPayment


WEBHOOK_URL = 'http://localhost:5000/webhooks/yookassa'

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
        'metadata': {'booking_id': booking_id, 'expires_at': expires_at.isoformat()},
    }

    try:
        payment = YooPayment.create(body, uuid.uuid4())

        token = getattr(getattr(payment, "confirmation", None),
                        "confirmation_token", None)

        print("payment_id:", payment.id)
        print("status:", payment.status)
        print("confirmation_token:", token)

    except requests.exceptions.ConnectionError as e:
        print("Network/DNS error contacting YooKassa:", e)

    except Exception as e:
        print("Unexpected error:", type(e).__name__, e)
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

        print("Payment captured successfully:", payment)

    except Exception as e:
        print("Unexpected error:", type(e).__name__, e)
        raise


def decline_payment():
    payment_id = '3033aee9-000f-5001-8000-146f7e05aba1'

    try:
        payment = YooPayment.cancel(payment_id)

        print("Payment declined successfully:", payment)

    except Exception as e:
        print("Unexpected error:", type(e).__name__, e)
        raise


if __name__ == "__main__":
    # create_payment()
    capture_payment()
    # decline_payment()
