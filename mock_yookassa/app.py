import os
import uuid
import threading
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

payments = {}

WEBHOOK_URL = os.getenv("WEBHOOK_URL")
AUTHORIZE_OK = os.getenv("AUTHORIZE_OK", "true").lower() == "true"
CAPTURE_OK = os.getenv("CAPTURE_OK", "true").lower() == "true"


def send_webhook(event, payment):
    if not WEBHOOK_URL:
        return
    payload = {"event": event, "object": payment}
    try:
        requests.post(WEBHOOK_URL, json=payload, timeout=5)
    except Exception:
        pass


@app.post("/payments")
def create_payment():
    payment_id = str(uuid.uuid4())
    payment = {
        "id": payment_id,
        "status": "pending",
        "confirmation": {
            "type": "embedded",
            "confirmation_token": f"token-{payment_id}"
        },
    }
    payments[payment_id] = payment
    status = "waiting_for_capture" if AUTHORIZE_OK else "canceled"
    payment = {**payment, "status": status}
    payments[payment_id] = payment
    threading.Thread(target=send_webhook, args=(f"payment.{status}", payment)).start()
    return jsonify(payment)


@app.post("/payments/<payment_id>/capture")
def capture_payment(payment_id):
    payment = payments.get(payment_id)
    if not payment:
        return jsonify({"message": "Not found"}), 404
    status = "succeeded" if CAPTURE_OK else "canceled"
    payment["status"] = status
    threading.Thread(target=send_webhook, args=(f"payment.{status}", payment)).start()
    return jsonify(payment)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
