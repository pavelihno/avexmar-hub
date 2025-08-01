from sqlalchemy.orm import Session

from app.database import db
from app.models._base_model import BaseModel
from app.models.country import Country
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

    def to_dict(self):
        return {
            'id': self.id,
            'iata_code': self.iata_code,
            'icao_code': self.icao_code,
            'name': self.name,
            'city_name': self.city_name,
            'city_name_en': self.city_name_en,
            'city_code': self.city_code,
            'country_id': self.country_id
        }

    upload_fields = {
        'name': 'Аэропорт',
        'city_name': 'Город',
        'city_name_en': 'Город (англ)',
        'iata_code': 'Код IATA',
        'icao_code': 'Код ICAO',
        'city_code': 'Код города',
        'country_code': 'Код страны'
    }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='name', descending=False)

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

                    airport = cls.create(session,
                                       **{
                        **row,
                        'country_id': country.id,
                    })
                    airports.append(airport)
                except Exception as e:
                    row['error'] = str(e)

            if row.get('error'):
                error_rows.append(row)

        return airports, error_rows
