from database import db
from models._base_model import BaseModel


class Route(BaseModel):
    __tablename__ = 'routes'

    flight_number = db.Column(db.String(), nullable=False)
    origin_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)
    destination_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)

    origin_airport = db.relationship('Airport', foreign_keys=[origin_airport_id], backref=db.backref('routes_from', lazy='dynamic'))
    destination_airport = db.relationship('Airport', foreign_keys=[destination_airport_id], backref=db.backref('routes_to', lazy='dynamic'))
    flights = db.relationship('Flight', backref='route', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'flight_number': self.flight_number,
            'origin_airport_id': self.origin_airport_id,
            'destination_airport_id': self.destination_airport_id
        }