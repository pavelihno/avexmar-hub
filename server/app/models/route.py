from app.database import db
from app.models._base_model import BaseModel


class Route(BaseModel):
    __tablename__ = 'routes'

    origin_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)
    destination_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'origin_airport_id': self.origin_airport_id,
            'destination_airport_id': self.destination_airport_id
        }
