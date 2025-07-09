from app.database import db
from app.models._base_model import BaseModel


class Route(BaseModel):
    __tablename__ = 'routes'

    flight_number = db.Column(db.String, nullable=False)
    origin_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)
    destination_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'flight_number': self.flight_number,
            'origin_airport_id': self.origin_airport_id,
            'destination_airport_id': self.destination_airport_id
        }