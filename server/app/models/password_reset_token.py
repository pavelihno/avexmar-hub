from datetime import datetime, timedelta
import secrets

from app.database import db
from app.models._base_model import BaseModel


class PasswordResetToken(BaseModel):
    __tablename__ = 'password_reset_tokens'

    token = db.Column(db.String, unique=True, index=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship('User')

    @classmethod
    def create_token(cls, user, expires_in_hours=1):
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
        instance = cls(token=token, user_id=user.id, expires_at=expires_at, used=False)
        db.session.add(instance)
        db.session.commit()
        return instance

    @classmethod
    def verify_token(cls, token):
        instance = cls.query.filter_by(token=token, used=False).first()
        if not instance:
            return None
        if instance.expires_at < datetime.utcnow():
            return None
        return instance
