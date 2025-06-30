from database import db
from models.base_model import BaseModel


class Flight(BaseModel):
    __tablename__ = 'flights'

    number = db.Column('flight_number', db.String(), nullable=False)
    origin_airport = db.Column('origin', db.String(), nullable=False)
    destination_airport = db.Column('destination', db.String(), nullable=False)
    scheduled_departure = db.Column('departure_time', db.DateTime)
    scheduled_arrival = db.Column('arrival_time', db.DateTime)

    economy_seats = db.Column(db.Integer, default=0)
    business_seats = db.Column(db.Integer, default=0)
    price_economy = db.Column(db.Numeric(10, 2))
    price_business = db.Column(db.Numeric(10, 2))
    currency = db.Column(db.String())

    def to_dict(self):
        return {
            'id': self.id,
            'number': self.number,
            'origin_airport': self.origin_airport,
            'destination_airport': self.destination_airport,
            'scheduled_departure': self.scheduled_departure,
            'scheduled_arrival': self.scheduled_arrival,
            'economy_seats': self.economy_seats,
            'business_seats': self.business_seats,
            'price_economy': float(self.price_economy) if self.price_economy else None,
            'price_business': float(self.price_business) if self.price_business else None,
            'currency': self.currency,
        }

    @classmethod
    def create(cls, **data):
        flight = cls(**data)
        db.session.add(flight)
        db.session.commit()
        return flight

    @classmethod
    def update(cls, _id, **data):
        flight = cls.get_by_id(_id)
        if flight:
            for key, value in data.items():
                if hasattr(flight, key):
                    setattr(flight, key, value)
            db.session.commit()
            return flight
        return None
