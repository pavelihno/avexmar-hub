from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.models.country import Country
from app.models.timezone import Timezone

if TYPE_CHECKING:
    from app.models.route import Route

from app.utils.xlsx import parse_xlsx, generate_xlsx_template


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

    def to_dict(self):
        return {
            'id': self.id,
            'iata_code': self.iata_code,
            'icao_code': self.icao_code,
            'name': self.name,
            'city_name': self.city_name,
            'city_name_en': self.city_name_en,
            'city_code': self.city_code,
            'country_id': self.country_id,
            'timezone_id': self.timezone_id,
            'time_zone': self.timezone.name if self.timezone else None,
        }

    upload_fields = {
        'name': 'Аэропорт',
        'city_name': 'Город',
        'city_name_en': 'Город (англ)',
        'iata_code': 'Код IATA',
        'icao_code': 'Код ICAO',
        'city_code': 'Код города',
        'country_code': 'Код страны',
        'time_zone': 'Часовой пояс'
    }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='name', descending=False)

    @classmethod
    def get_by_code(cls, code):
        """Get airport by IATA code"""
        if not code:
            return None
        code = code.upper()
        return cls.query.filter(cls.iata_code == code).one_or_none()

    @classmethod
    def get_xlsx_template(cls):
        return generate_xlsx_template(cls.upload_fields)

    @classmethod
    def upload_from_file(cls, file, session: Session | None = None):
        session = session or db.session
        rows = parse_xlsx(
            file,
            cls.upload_fields,
            required_fields=[
                'name',
                'iata_code',
                'icao_code',
                'city_name',
                'city_code',
                'country_code',
            ],
        )

        airports = []
        error_rows = []

        for row in rows:
            if not row.get('error'):
                try:
                    country = Country.get_by_code(row.get('country_code'))
                    if not country:
                        raise ValueError('Invalid country code')

                    tz_name = row.get('time_zone')
                    tz = None
                    if tz_name:
                        tz = Timezone.query.filter_by(name=tz_name).first()

                    airport = cls.create(
                        session,
                        **{
                            **row,
                            'country_id': country.id,
                            'timezone_id': tz.id if tz else None,
                        }
                    )
                    airports.append(airport)
                except Exception as e:
                    row['error'] = str(e)

            if row.get('error'):
                error_rows.append(row)

        return airports, error_rows
