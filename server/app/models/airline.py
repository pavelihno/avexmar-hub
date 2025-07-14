from app.database import db
from app.models._base_model import BaseModel


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
