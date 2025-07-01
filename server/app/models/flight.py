from database import db
from models.base_model import BaseModel
from config import Config


class Flight(BaseModel):
    __tablename__ = 'flights'

    number = db.Column(db.String(), nullable=False)
    origin_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id'), nullable=False)
    destination_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id'), nullable=False)

    scheduled_departure = db.Column(db.DateTime, nullable=True)
    scheduled_arrival = db.Column(db.DateTime, nullable=True)

    economy_seats = db.Column(db.Integer, default=0, nullable=False)
    business_seats = db.Column(db.Integer, default=0, nullable=False)
    price_economy = db.Column(db.Float, nullable=True)
    price_business = db.Column(db.Float, nullable=True)
    currency = db.Column(db.String(), default=Config.DEFAULT_CURRENCY, server_default=Config.DEFAULT_CURRENCY, nullable=False)

    status = db.Column(db.String, nullable=False, default=Config.DEFAULT_FLIGHT_STATUS, server_default=Config.DEFAULT_FLIGHT_STATUS)

    origin_airport = db.relationship('Airport', foreign_keys=[origin_airport_id], backref='flights_from')
    destination_airport = db.relationship('Airport', foreign_keys=[destination_airport_id], backref='flights_to')

    __table_args__ = (
        db.CheckConstraint(currency.in_(Config.ENUM_CURRENCY), name='flight_currency_types'),
        db.CheckConstraint(status.in_(Config.ENUM_FLIGHT_STATUS), name='flight_status_types'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'number': self.number,
            'origin_airport_id': self.origin_airport_id, 
            'destination_airport_id': self.destination_airport_id,
            'scheduled_departure': self.scheduled_departure,
            'scheduled_arrival': self.scheduled_arrival,
            'economy_seats': self.economy_seats,
            'business_seats': self.business_seats,
            'price_economy': float(self.price_economy) if self.price_economy is not None else None,
            'price_business': float(self.price_business) if self.price_business is not None else None,
            'currency': self.currency,
            'status': self.status
        }
