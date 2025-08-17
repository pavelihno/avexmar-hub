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


def confirm_payment():
    pass


def decline_payment():
    pass


if __name__ == "__main__":
    create_payment()
