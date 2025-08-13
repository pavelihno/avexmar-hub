from app.database import db
from app.models._base_model import BaseModel


class Aircraft(BaseModel):
    __tablename__ = 'aircrafts'

    type = db.Column(db.String, nullable=False, unique=True)

    flights = db.relationship('Flight', back_populates='aircraft', lazy='dynamic')

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'type': self.type,
        }
