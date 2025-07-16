from app.database import db
from app.models._base_model import BaseModel
from app.utils.xlsx_uploader import parse_xlsx, generate_xlsx_template


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
        'country_id': 'Код страны'
    }

    @classmethod
    def get_xlsx_template(cls):
        return generate_xlsx_template(cls.upload_fields)

    @classmethod
    def upload_from_file(cls, file):
        pass
