from typing import List, TYPE_CHECKING

from sqlalchemy.orm import Session, Mapped

from app.constants.messages import CountryMessages
from app.database import db
from app.models._base_model import BaseModel
from app.models.country import Country
from app.utils.xlsx import parse_upload_xlsx_template, get_upload_xlsx_template, get_upload_xlsx_report

if TYPE_CHECKING:
    from app.models.flight import Flight


class Airline(BaseModel):
    __tablename__ = 'airlines'

    iata_code = db.Column(db.String(2), unique=True, nullable=False)
    icao_code = db.Column(db.String(3), unique=True, nullable=False)
    internal_code = db.Column(db.String(2), nullable=True)
    name = db.Column(db.String, nullable=False)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id', ondelete='RESTRICT'), nullable=False)

    country: Mapped['Country'] = db.relationship('Country', back_populates='airlines')
    flights: Mapped[List['Flight']] = db.relationship('Flight', back_populates='airline', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'iata_code': self.iata_code,
            'icao_code': self.icao_code,
            'internal_code': self.internal_code,
            'name': self.name,
            'country': self.country.to_dict(return_children) if return_children else {},
            'country_id': self.country_id
        }

    upload_fields = {
        'name': 'Авиакомпания',
        'iata_code': 'Код IATA',
        'icao_code': 'Код ICAO',
        'internal_code': 'Внутренний код',
        'country_code': 'Код страны'
    }

    upload_required_fields = ['name', 'iata_code', 'icao_code', 'country_code']

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['name'], descending=False)

    @classmethod
    def get_by_code(cls, code):
        if not code:
            return None
        code = code.upper()
        return cls.query.filter(cls.iata_code == code).one_or_none()

    @classmethod
    def get_upload_xlsx_template(cls):
        return get_upload_xlsx_template(
            cls.upload_fields,
            model_class=cls,
            required_fields=cls.upload_required_fields,
        )

    @classmethod
    def get_upload_xlsx_report(cls, error_rows):
        return get_upload_xlsx_report(
            cls.upload_fields,
            cls,
            cls.upload_required_fields,
            [],
            error_rows
        )

    @classmethod
    def upload_from_file(
        cls,
        file,
        session: Session | None = None,
    ):
        session = session or db.session
        rows = parse_upload_xlsx_template(
            file,
            cls.upload_fields,
            model_class=cls,
            required_fields=cls.upload_required_fields,
        )

        def process_row(row, row_session: Session):
            from app.models.country import Country

            country = Country.get_by_code(row.get('country_code'))
            if not country:
                raise ValueError(CountryMessages.INVALID_COUNTRY_CODE)

            return cls.create(
                row_session,
                iata_code=str(row.get('iata_code')),
                icao_code=str(row.get('icao_code')),
                internal_code=str(row.get('internal_code')) if row.get('internal_code') is not None else None,
                name=str(row.get('name')),
                country_id=country.id,
                commit=False,
            )

        return super()._process_upload_rows(rows, process_row, session=session)
