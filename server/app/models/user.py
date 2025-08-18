from typing import List, TYPE_CHECKING
from werkzeug.security import generate_password_hash, check_password_hash

from app.database import db
from app.models._base_model import BaseModel
from sqlalchemy.orm import Session, Mapped
from app.utils.enum import USER_ROLE, DEFAULT_USER_ROLE

if TYPE_CHECKING:
    from app.models.password_reset_token import PasswordResetToken
    from app.models.passenger import Passenger
    from app.models.booking import Booking


class User(BaseModel):
    __tablename__ = 'users'

    email = db.Column(db.String, unique=True, index=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    role = db.Column(db.Enum(USER_ROLE), nullable=False, default=DEFAULT_USER_ROLE)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    reset_tokens: Mapped[List['PasswordResetToken']] = db.relationship(
        'PasswordResetToken', back_populates='user', lazy='dynamic', cascade='all, delete-orphan'
    )
    passengers: Mapped[List['Passenger']] = db.relationship(
        'Passenger', back_populates='owner_user', lazy='dynamic', cascade='all, delete-orphan'
    )
    bookings: Mapped[List['Booking']] = db.relationship(
        'Booking', back_populates='user', lazy='dynamic', cascade='all, delete-orphan'
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role.value,
            'is_active': self.is_active
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['email'], descending=False)

    @classmethod
    def create(
        cls,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session

        for key, value in kwargs.items():
            if key == 'password':
                kwargs['password'] = cls.__encode_password(value)
            elif key == 'email' and isinstance(value, str):
                kwargs['email'] = value.lower()

        return super().create(session=session, commit=commit, **kwargs)

    @classmethod
    def get_by_email(cls, _email):
        if not isinstance(_email, str):
            return None
        return cls.query.filter(cls.email == _email.lower()).one_or_none()

    @classmethod
    def update(
        cls,
        _id,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session

        kwargs = {k: v for k, v in kwargs.items() if k in ['role', 'is_active']}

        return super().update(_id, session=session, commit=commit, **kwargs)

    @classmethod
    def login(cls, _email, _password):
        user = cls.get_by_email(_email)
        if user and user.is_active and cls.__is_password_correct(user.password, _password):
            return user
        return None

    @classmethod
    def change_password(cls, _id, _password, session: Session | None = None):
        session = session or db.session

        new_password = cls.__encode_password(_password)

        return super().update(_id, session=session, password=new_password)

    @classmethod
    def __encode_password(cls, _password):
        return generate_password_hash(_password)

    @classmethod
    def __is_password_correct(cls, correct_password, input_password):
        return check_password_hash(correct_password, input_password)
