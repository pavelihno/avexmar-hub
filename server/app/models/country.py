from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.utils.xlsx import parse_xlsx, generate_xlsx_template

if TYPE_CHECKING:
    from app.models.airline import Airline
    from app.models.airport import Airport
    from app.models.passenger import Passenger


class Country(BaseModel):
    __tablename__ = 'countries'

    name = db.Column(db.String, nullable=False)
    name_en = db.Column(db.String, nullable=True)
    code_a2 = db.Column(db.String(2), nullable=False, unique=True)
    code_a3 = db.Column(db.String(3), nullable=False, unique=True)

    airlines: Mapped[List['Airline']] = db.relationship('Airline', back_populates='country', lazy='dynamic')
    airports: Mapped[List['Airport']] = db.relationship('Airport', back_populates='country', lazy='dynamic')
    passengers: Mapped[List['Passenger']] = db.relationship('Passenger', back_populates='citizenship', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_en': self.name_en,
            'code_a2': self.code_a2,
            'code_a3': self.code_a3
        }

    upload_fields = {
        'name': 'Страна',
        'name_en': 'Страна (англ)',
        'code_a2': 'Код A2',
        'code_a3': 'Код A3'
    }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='name', descending=False)

    @classmethod
    def create(cls, session: Session | None = None, **kwargs):
        session = session or db.session
        kwargs['code_a2'] = kwargs.get('code_a2', '').upper()
        kwargs['code_a3'] = kwargs.get('code_a3', '').upper()
        return super().create(session, **kwargs)

    @classmethod
    def get_xlsx_template(cls):
        return generate_xlsx_template(cls.upload_fields)

    @classmethod
    def get_by_code(cls, code):
        """Get country by A2 or A3 code"""
        if not code:
            return None
        return cls.query.filter((cls.code_a2 == code) | (cls.code_a3 == code)).first()

    @classmethod
    def upload_from_file(cls, file, session: Session | None = None):
        session = session or db.session
        rows = parse_xlsx(
            file, cls.upload_fields,
            required_fields=['name', 'code_a2', 'code_a3']
        )
        countries = []
        error_rows = []
        for row in rows:
            if not row.get('error'):
                try:
                    country = cls.create(session, **row)
                    countries.append(country)
                except Exception as e:
                    row['error'] = str(e)

            if row.get('error'):
                error_rows.append(row)

        return countries, error_rows
