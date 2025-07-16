from werkzeug.security import generate_password_hash, check_password_hash

from app.database import db
from app.models._base_model import BaseModel, ModelValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.config import Config


class User(BaseModel):
    __tablename__ = 'users'

    email = db.Column(db.String, unique=True, index=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    role = db.Column(db.Enum(Config.USER_ROLE), nullable=False, default=Config.DEFAULT_USER_ROLE)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role.value,
            'is_active': self.is_active
        }

    @classmethod
    def create(cls, session: Session | None = None, **data):
        session = session or db.session
        existing_user = cls.get_by_email(data.get('email', ''))
        if existing_user:
            raise ModelValidationError({'email': 'must be unique'})

        user = cls()
        for key, value in data.items():
            if key == 'password':
                value = cls.__encode_password(value)
            setattr(user, key, value)

        session.add(user)
        try:
            session.commit()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'database': str(e)}) from e

        return user

    @classmethod
    def get_by_email(cls, _email):
        return cls.query.filter_by(email=_email).first()

    @classmethod
    def update(cls, _id, session: Session | None = None, **data):
        session = session or db.session
        user = cls.get_by_id(_id)
        if not user:
            return None

        for key, value in data.items():
            if key in ['role', 'is_active']:
                setattr(user, key, value)

        try:
            session.commit()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'database': str(e)}) from e
        return user

    @classmethod
    def login(cls, _email, _password):
        user = cls.get_by_email(_email)
        if user and cls.__is_password_correct(user.password, _password):
            return user
        return None

    @classmethod
    def change_password(cls, _id, _password, session: Session | None = None):
        session = session or db.session
        user = cls.get_by_id(_id)
        if not user:
            return None
        user.password = cls.__encode_password(_password)
        try:
            session.commit()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'database': str(e)}) from e
        return user

    @classmethod
    def __encode_password(cls, _password):
        return generate_password_hash(_password)

    @classmethod
    def __is_password_correct(cls, correct_password, input_password):
        return check_password_hash(correct_password, input_password)
