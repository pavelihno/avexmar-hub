import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped
from sqlalchemy import Index

from app.database import db
from app.models._base_model import BaseModel
from app.models.country import Country
from app.config import Config

if TYPE_CHECKING:
    from app.models.booking_passenger import BookingPassenger
    from app.models.ticket import Ticket


class Passenger(BaseModel):
    __tablename__ = 'passengers'

    owner_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    patronymic_name = db.Column(db.String, nullable=True)

    gender = db.Column(db.Enum(Config.GENDER), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    document_type = db.Column(db.Enum(Config.DOCUMENT_TYPE), nullable=False)
    document_number = db.Column(db.String, nullable=False)
    document_expiry_date = db.Column(db.Date, nullable=True)
    citizenship_id = db.Column(db.Integer, db.ForeignKey('countries.id'), nullable=False)

    citizenship: Mapped['Country'] = db.relationship('Country', back_populates='passengers')
    booking_passengers: Mapped[List['BookingPassenger']] = db.relationship(
        'BookingPassenger', back_populates='passenger', lazy='dynamic', cascade='all, delete-orphan'
    )
    tickets: Mapped[List['Ticket']] = db.relationship(
        'Ticket', back_populates='passenger', lazy='dynamic', cascade='all, delete-orphan'
    )

    __table_args__ = (
        Index(
            'ux_passenger_by_owner',
            owner_user_id,
            first_name,
            last_name,
            birth_date,
            document_type,
            document_number,
            unique=True,
            postgresql_where=owner_user_id.isnot(None)
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'owner_user_id': self.owner_user_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'gender': self.gender.value,
            'birth_date': self.birth_date.isoformat(),
            'document_type': self.document_type.value,
            'document_number': self.document_number,
            'document_expiry_date': self.document_expiry_date.isoformat() if self.document_expiry_date else None,
            'citizenship_id': self.citizenship_id
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['last_name'], descending=False)

    def is_infant(self, date=datetime.date.today()):
        """Check if the passenger is an infant (under 1 year old)"""
        years = date.year - self.birth_date.year - ((date.month, date.day) < (self.birth_date.month, self.birth_date.day))
        return years < 1

    def is_child(self, date=datetime.date.today()):
        """Check if the passenger is a child (between 1 and 3 years old)"""
        years = date.year - self.birth_date.year - ((date.month, date.day) < (self.birth_date.month, self.birth_date.day))
        return 1 <= years < 3

    @classmethod
    def _prepare_for_save(cls, session: Session, kwargs: dict, current_id=None):
        """Apply defaults and reuse existing passenger if unique data matches"""
        if kwargs.get('document_type') in (
            Config.DOCUMENT_TYPE.passport.value,
            Config.DOCUMENT_TYPE.birth_certificate.value,
        ):
            kwargs['citizenship_id'] = Country.get_by_code(
                Config.DEFAULT_CITIZENSHIP_CODE
            ).id

        unique_fields = [
            'first_name',
            'last_name',
            'birth_date',
            'document_type',
            'document_number',
        ]

        owner_id = kwargs.get('owner_user_id')
        if owner_id is not None and all(field in kwargs for field in unique_fields):
            existing = session.query(cls).filter(
                cls.owner_user_id == owner_id,
                cls.first_name == kwargs['first_name'],
                cls.last_name == kwargs['last_name'],
                cls.birth_date == kwargs['birth_date'],
                cls.document_type == kwargs['document_type'],
                cls.document_number == kwargs['document_number'],
            ).one_or_none()
            if existing and (current_id is None or existing.id != current_id):
                super().update(existing.id, session, **kwargs)
                return existing

        return None

    @classmethod
    def create(cls, session: Session | None = None, **kwargs):
        session = session or db.session

        existing = cls._prepare_for_save(session, kwargs)
        if existing:
            return existing

        return super().create(session, **kwargs)

    @classmethod
    def update(cls, _id, session: Session | None = None, **kwargs):
        """Update passenger or reuse existing one with the same unique data."""
        session = session or db.session

        existing = cls._prepare_for_save(session, kwargs, current_id=_id)
        if existing:
            return existing

        return super().update(_id, session, **kwargs)
