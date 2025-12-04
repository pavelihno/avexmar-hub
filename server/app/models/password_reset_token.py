import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Mapped, Session

from app.database import db
from app.config import Config
from app.models._base_model import BaseModel
from app.constants.models import ModelVerboseNames
from app.models.user import User

class PasswordResetToken(BaseModel):
    __tablename__ = 'password_reset_tokens'
    __verbose_name__ = ModelVerboseNames.PasswordResetToken

    token = db.Column(db.String, unique=True, index=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)

    user: Mapped['User'] = db.relationship('User', back_populates='reset_tokens')

    @classmethod
    def create(
        cls,
        user: User,
        session: Session | None = None,
        *,
        commit: bool = False,
    ):
        session = session or db.session

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=Config.PASSWORD_RESET_EXP_HOURS)

        return super().create(
            session=session,
            commit=commit,
            token=token,
            user_id=user.id,
            expires_at=expires_at,
            used=False,
        )

    @classmethod
    def verify_token(cls, token):
        instance = cls.query.filter(
            cls.token == token,
            cls.used.is_(False)
        ).one_or_none()
        if not instance:
            return None

        now = datetime.now(timezone.utc)
        expires_at = instance.expires_at
        if expires_at is None:
            return None
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            return None
        return instance
