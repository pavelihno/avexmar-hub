from flask_mail import Mail, Message
from flask import render_template

mail = Mail()


def init_mail(app):
    mail.init_app(app)


def send_email(subject: str, recipients: list[str], template: str, **context) -> None:
    msg = Message(subject=subject, recipients=recipients)
    msg.body = render_template(template, **context)
    mail.send(msg)
