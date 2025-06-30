from database import db
from models.base_model import BaseModel


class Passenger(BaseModel):
    __tablename__ = 'passengers'

    name = db.Column('full_name', db.String(), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(), nullable=False)
    document_id = db.Column('id_document', db.String(), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'birth_date': self.birth_date,
            'gender': self.gender,
            'document_id': self.document_id
        }

    @classmethod
    def create(cls, **data):
        passenger = cls(**data)
        db.session.add(passenger)
        db.session.commit()
        return passenger

    @classmethod
    def update(cls, _id, **data):
        passenger = cls.get_by_id(_id)
        if passenger:
            for key, value in data.items():
                if hasattr(passenger, key):
                    setattr(passenger, key, value)
            db.session.commit()
            return passenger
        return None
