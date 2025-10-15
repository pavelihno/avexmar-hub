from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped

from app.constants.messages import CountryMessages
from app.database import db
from app.models._base_model import BaseModel
from app.models.country import Country
from app.models.timezone import Timezone

if TYPE_CHECKING:
    from app.models.route import Route

from app.utils.xlsx import parse_upload_xlsx_template, get_upload_xlsx_template, get_upload_xlsx_report


class Airport(BaseModel):
    __tablename__ = 'airports'

    iata_code = db.Column(db.String(3), unique=True, nullable=False)
    icao_code = db.Column(db.String(4), unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)

    city_name = db.Column(db.String, nullable=False)
    city_name_en = db.Column(db.String, nullable=True)
    city_code = db.Column(db.String, nullable=False)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id', ondelete='RESTRICT'), nullable=False)
    timezone_id = db.Column(db.Integer, db.ForeignKey('timezones.id', ondelete='RESTRICT'), nullable=True)

    country: Mapped['Country'] = db.relationship('Country', back_populates='airports')
    timezone: Mapped['Timezone'] = db.relationship('Timezone', back_populates='airports')
    origin_routes: Mapped[List['Route']] = db.relationship(
        'Route', back_populates='origin_airport', foreign_keys='Route.origin_airport_id', lazy='dynamic'
    )
    destination_routes: Mapped[List['Route']] = db.relationship(
        'Route', back_populates='destination_airport', foreign_keys='Route.destination_airport_id', lazy='dynamic'
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'iata_code': self.iata_code,
            'icao_code': self.icao_code,
            'name': self.name,
            'city_name': self.city_name,
            'city_name_en': self.city_name_en,
            'city_code': self.city_code,
            'country': self.country.to_dict(return_children) if return_children else {},
            'country_id': self.country_id,
            'timezone': self.timezone.to_dict(return_children) if self.timezone_id and return_children else {},
            'timezone_id': self.timezone_id,
        }

    upload_fields = {
        'name': 'Аэропорт',
        'city_name': 'Город',
        'city_name_en': 'Город (англ)',
        'iata_code': 'Код IATA',
        'icao_code': 'Код ICAO',
        'city_code': 'Код города',
        'country_code': 'Код страны',
        'timezone': 'Часовой пояс'
    }

    upload_required_fields = ['name', 'iata_code', 'icao_code', 'city_name', 'city_code', 'country_code']

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
            country = Country.get_by_code(row.get('country_code'))
            if not country:
                raise ValueError(CountryMessages.INVALID_COUNTRY_CODE)

            tz_name = row.get('timezone')
            tz = None
            if tz_name:
                tz = Timezone.query.filter(
                    Timezone.name == tz_name
                ).one_or_none()

            return cls.create(
                row_session,
                name=str(row.get('name')),
                city_name=str(row.get('city_name')),
                city_name_en=str(row.get('city_name_en')),
                iata_code=str(row.get('iata_code')),
                icao_code=str(row.get('icao_code')),
                city_code=str(row.get('city_code')),
                country_id=country.id,
                timezone_id=tz.id if tz else None,
                commit=False,
            )

        return super()._process_upload_rows(rows, process_row, session=session)
