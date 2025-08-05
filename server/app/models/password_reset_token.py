import secrets
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class PasswordResetToken(BaseModel):
    __tablename__ = 'password_reset_tokens'

    token = db.Column(db.String, unique=True, index=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)

    user: Mapped['User'] = db.relationship('User', back_populates='reset_tokens')

    @classmethod
    def create_token(cls, user, expires_in_hours=1):
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)
        instance = cls(token=token, user_id=user.id, expires_at=expires_at, used=False)
        db.session.add(instance)
        db.session.commit()
        return instance

    @classmethod
    def verify_token(cls, token):
        instance = cls.query.filter_by(token=token, used=False).first()
        if not instance:
            return None

        now = datetime.now(timezone.utc)
        expires_at = instance.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            return None
        return instance
