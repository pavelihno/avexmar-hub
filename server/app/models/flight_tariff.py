from app.database import db
from app.models._base_model import BaseModel


class FlightTariff(BaseModel):
    __tablename__ = 'flight_tariffs'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    tariff_id = db.Column(db.Integer, db.ForeignKey('tariffs.id', ondelete='CASCADE'), nullable=False)
    seats_number = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'flight_id': self.flight_id,
            'tariff_id': self.tariff_id,
            'seats_number': self.seats_number
        }
