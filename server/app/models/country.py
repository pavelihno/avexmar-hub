from app.database import db
from app.models._base_model import BaseModel


class Country(BaseModel):
    __tablename__ = 'countries'

    name = db.Column(db.String, nullable=False)
    name_en = db.Column(db.String, nullable=True)
    code_a2 = db.Column(db.String(2), nullable=False, unique=True)
    code_a3 = db.Column(db.String(3), nullable=False, unique=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_en': self.name_en,
            'code_a2': self.code_a2,
            'code_a3': self.code_a3
        }
