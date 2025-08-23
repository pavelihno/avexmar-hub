from threading import Thread
import enum

from app.config import Config
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
    app.config.setdefault('MAIL_USERNAME', None)
    app.config.setdefault('MAIL_PASSWORD', None)
    mail.init_app(app)


def __send_async_email(app, msg, username, password) -> None:
    with app.app_context():
        app.config['MAIL_USERNAME'] = username
        app.config['MAIL_PASSWORD'] = password

        with mail.connect() as conn:
            conn.host.login(username, password)

            conn.send(msg)


def __select_mail_account(is_noreply: bool):
    if is_noreply:
        return Config.MAIL_NOREPLY_USERNAME, Config.MAIL_NOREPLY_PASSWORD
    return Config.MAIL_DEFAULT_USERNAME, Config.MAIL_DEFAULT_PASSWORD


def send_email(email_type: EMAIL_TYPE, is_noreply: bool = False, **context) -> None:
    recipients = context.pop('recipients', None)
    attachments = context.pop('attachments', [])
    if not recipients:
        return
    subject = email_type.subject.format(**context)
    template = email_type.template

    username, password = __select_mail_account(is_noreply)

    if not isinstance(recipients, list):
        recipients = [recipients]

    msg = Message(
        subject=subject,
        recipients=recipients,
        sender=username,
        reply_to=username
    )

    try:
        msg.body = render_template(f'email/txt/{template}.txt', **context)
        msg.html = render_template(f'email/html/{template}.html', **context)
    except Exception as e:
        print(f"Template rendering error: {e}")
        raise

    for attachment in attachments:
        if isinstance(attachment, dict):
            msg.attach(
                attachment.get('filename', 'attachment'),
                attachment.get('content_type', 'application/octet-stream'),
                attachment.get('data'),
            )

    app = current_app._get_current_object()
    Thread(target=__send_async_email, args=(
        app, msg, username, password), daemon=True
    ).start()
