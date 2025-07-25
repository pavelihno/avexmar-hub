import datetime
from sqlalchemy.orm import Session

from app.database import db
from app.models._base_model import BaseModel
from app.models.country import Country
from app.config import Config


class Passenger(BaseModel):
    __tablename__ = 'passengers'

    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)

    gender = db.Column(db.Enum(Config.GENDER), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    document_type = db.Column(db.Enum(Config.DOCUMENT_TYPE), nullable=False)
    document_number = db.Column(db.String, nullable=False)
    document_expiry_date = db.Column(db.Date, nullable=True)
    citizenship_id = db.Column(db.Integer, db.ForeignKey('countries.id'), nullable=False)

    __table_args__ = (
        db.UniqueConstraint(
            'first_name', 'last_name', 'birth_date', 'document_type', 'document_number',
            name='uix_passenger_unique'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
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
        return super().get_all(sort_by='last_name', descending=False)

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

        if all(field in kwargs for field in unique_fields):
            existing = session.query(cls).filter_by(
                first_name=kwargs['first_name'],
                last_name=kwargs['last_name'],
                birth_date=kwargs['birth_date'],
                document_type=kwargs['document_type'],
                document_number=kwargs['document_number'],
            ).first()
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
