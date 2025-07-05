from app.database import db
from app.models._base_model import BaseModel


class Airport(BaseModel):
    __tablename__ = 'airports'

    iata_code = db.Column(db.String(3), unique=True, index=True, nullable=False)
    icao_code = db.Column(db.String(4), unique=True, index=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    city_code = db.Column(db.String, nullable=False)
    country_code = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'iata_code': self.iata_code,
            'icao_code': self.icao_code,
            'name': self.name,
            'city_code': self.city_code,
            'country_code': self.country_code
        }
