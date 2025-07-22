from sqlalchemy.orm import Session

from app.database import db
from app.models._base_model import BaseModel
from app.utils.xlsx import parse_xlsx, generate_xlsx_template


class Airline(BaseModel):
    __tablename__ = 'airlines'

    iata_code = db.Column(db.String(2), unique=True, nullable=False)
    icao_code = db.Column(db.String(3), unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id', ondelete='RESTRICT'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'iata_code': self.iata_code,
            'icao_code': self.icao_code,
            'name': self.name,
            'country_id': self.country_id
        }

    upload_fields = {
        'name': 'Авиакомпания',
        'iata_code': 'Код IATA',
        'icao_code': 'Код ICAO',
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
            required_fields=['name', 'iata_code', 'icao_code', 'country_code'],
        )

        airlines = []
        error_rows = []

        for row in rows:
            if not row.get('error'):
                try:
                    from app.models.country import Country

                    country = Country.get_by_code(row.get('country_code'))
                    if not country:
                        raise ValueError('Invalid country code')

                    airline = cls.create(session,
                                       **{
                       **row,
                       'country_id': country.id,
                    })
                    airlines.append(airline)
                except Exception as e:
                    row['error'] = str(e)

            if row.get('error'):
                error_rows.append(row)

        return airlines, error_rows
