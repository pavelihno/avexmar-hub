from database import db
from models.base_model import BaseModel


class Airport(BaseModel):
    __tablename__ = 'airports'

    iata_code = db.Column(db.String(3), primary_key=True, index=True, unique=True)
    icao_code = db.Column(db.String(4), unique=True, index=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    city_code = db.Column(db.String, nullable=False)
    country_code = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {
            'iata_code': self.iata_code,
            'icao_code': self.icao_code,
            'name': self.name,
            'city_code': self.city_code,
            'country_code': self.country_code
        }

    @classmethod
    def create(cls, **data):
        airport = cls(**data)
        db.session.add(airport)
        db.session.commit()
        return airport

    @classmethod
    def update(cls, iata_code, **data):
        airport = cls.get_by_id(iata_code)
        if airport:
            for key, value in data.items():
                if key in ['name', 'city_code', 'country_code']:
                    setattr(airport, key, value)
            db.session.commit()
            return airport
        return None
