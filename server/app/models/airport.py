from database import db
from models.base_model import BaseModel


class Airport(BaseModel):
    __tablename__ = 'airports'

    code = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)
    city_code = db.Column(db.String, nullable=False)
    country_code = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {
            'code': self.code,
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
    def update(cls, code, **data):
        airport = cls.get_by_id(code)
        if airport:
            for key, value in data.items():
                if key in ['name', 'city_code', 'country_code']:
                    setattr(airport, key, value)
            db.session.commit()
            return airport
        return None
