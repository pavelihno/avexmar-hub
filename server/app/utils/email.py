from threading import Thread
import enum


from flask import current_app, render_template
from flask_mail import Mail, Message

mail = Mail()


class EMAIL_TYPE(enum.Enum):
    booking_confirmation = (
        'booking_confirmation',
        'Подтверждение бронирования № {booking_number}',
    )
    invoice_payment = (
        'invoice_payment',
        'Счёт на оплату бронирования',
    )
    password_reset = (
        'forgot_password',
        'Сброс пароля',
    )

    def __init__(self, template: str, subject: str):
        self.template = template
        self.subject = subject


def init_mail(app):
    mail.init_app(app)


def _send_async_email(app, msg) -> None:
    with app.app_context():
        mail.send(msg)


def send_email(email_type: EMAIL_TYPE, **context) -> None:
    recipients = context.pop('recipients', None)
    attachments = context.pop('attachments', [])
    if not recipients:
        return
    subject = email_type.subject.format(**context)
    template = email_type.template
    msg = Message(
        subject=subject,
        recipients=recipients if isinstance(recipients, list) else [recipients],
    )
    msg.body = render_template(f'email/txt/{template}.txt', **context)
    msg.html = render_template(f'email/html/{template}.html', **context)
    for attachment in attachments:
        if isinstance(attachment, dict):
            msg.attach(
                attachment.get('filename', 'attachment'),
                attachment.get('content_type', 'application/octet-stream'),
                attachment.get('data'),
            )
    app = current_app._get_current_object()
    Thread(target=_send_async_email, args=(app, msg), daemon=True).start()
