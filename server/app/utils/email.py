from threading import Thread

from flask import current_app, render_template
from flask_mail import Mail, Message

mail = Mail()


def init_mail(app):
    mail.init_app(app)


def _send_async_email(app, msg) -> None:
    with app.app_context():
        mail.send(msg)


def send_email(subject: str, recipients: list[str], template: str, **context) -> None:
    msg = Message(subject=subject, recipients=recipients)
    msg.body = render_template(template, **context)
    app = current_app._get_current_object()
    Thread(target=_send_async_email, args=(app, msg), daemon=True).start()
