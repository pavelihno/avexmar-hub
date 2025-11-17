import enum

from app.config import Config
from flask import current_app, render_template
from flask_mail import Mail, Message

from app.constants.branding import (
    DEFAULT_EMAIL_CONTEXT,
    EMAIL_SUBJECTS,
    EMAIL_TEMPLATES,
    BRAND_NAME,
)
from app.constants.messages import ErrorMessages


mail = Mail()


class EmailError(Exception):
    """Raised when sending an email fails"""
    pass


class EMAIL_TYPE(enum.Enum):
    booking_confirmation = (
        EMAIL_TEMPLATES['booking_confirmation'],
        EMAIL_SUBJECTS['booking_confirmation'],
    )
    invoice_payment = (
        EMAIL_TEMPLATES['invoice_payment'],
        EMAIL_SUBJECTS['invoice_payment'],
    )
    password_reset = (
        EMAIL_TEMPLATES['password_reset'],
        EMAIL_SUBJECTS['password_reset'],
    )
    account_activation = (
        EMAIL_TEMPLATES['account_activation'],
        EMAIL_SUBJECTS['account_activation'],
    )
    two_factor = (
        EMAIL_TEMPLATES['two_factor'],
        EMAIL_SUBJECTS['two_factor'],
    )
    password_change = (
        EMAIL_TEMPLATES['password_change'],
        EMAIL_SUBJECTS['password_change'],
    )
    ticket_issued = (
        EMAIL_TEMPLATES['ticket_issued'],
        EMAIL_SUBJECTS['ticket_issued'],
    )
    ticket_refund = (
        EMAIL_TEMPLATES['ticket_refund'],
        EMAIL_SUBJECTS['ticket_refund'],
    )
    ticket_refund_rejected = (
        EMAIL_TEMPLATES['ticket_refund_rejected'],
        EMAIL_SUBJECTS['ticket_refund_rejected'],
    )

    def __init__(self, template: str, subject: str):
        self.template = template
        self.subject = subject


def init_mail(app):
    app.config.setdefault('MAIL_USERNAME', None)
    app.config.setdefault('MAIL_PASSWORD', None)
    mail.init_app(app)


def __send_email(app, msg, username, password) -> None:
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

    context = {**DEFAULT_EMAIL_CONTEXT, **context}
    subject = email_type.subject.format(**context)
    template = email_type.template

    username, password = __select_mail_account(is_noreply)

    if not isinstance(recipients, list):
        recipients = [recipients]

    msg = Message(
        subject=subject,
        recipients=recipients,
        sender=(BRAND_NAME.upper(), username),
        reply_to=username
    )

    try:
        msg.body = render_template(f'email/txt/{template}.txt', **context)
        msg.html = render_template(f'email/html/{template}.html', **context)
    except Exception as e:
        raise EmailError(ErrorMessages.FAILED_TO_SEND_EMAIL) from e

    for attachment in attachments:
        if isinstance(attachment, dict):
            msg.attach(
                attachment.get('filename', 'attachment'),
                attachment.get('content_type', 'application/octet-stream'),
                attachment.get('data'),
            )

    app = current_app._get_current_object()
    try:
        __send_email(app, msg, username, password)
    except Exception as e:
        raise EmailError(ErrorMessages.FAILED_TO_SEND_EMAIL) from e
