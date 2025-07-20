from app.database import db
from app.models._base_model import BaseModel
from app.config import Config

from app.utils.datetime import split_iso_datetime


class Flight(BaseModel):
    __tablename__ = 'flights'

    flight_number = db.Column(db.String, nullable=False, unique=True)
    route_id = db.Column(db.Integer, db.ForeignKey('routes.id', ondelete='RESTRICT'), nullable=False)
    airline_id = db.Column(db.Integer, db.ForeignKey('airlines.id', ondelete='RESTRICT'), nullable=False)
    aircraft = db.Column(db.String, nullable=True)

    scheduled_departure = db.Column(db.Date, nullable=False)
    scheduled_departure_time = db.Column(db.Time, nullable=True)

    scheduled_arrival = db.Column(db.Date, nullable=False)
    scheduled_arrival_time = db.Column(db.Time, nullable=True)

    tariffs = db.relationship('FlightTariff', backref=db.backref('flight', lazy=True), lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint(
            'flight_number', 'airline_id', 'route_id', 'scheduled_departure',
            name='uix_flight_number_airline_route_departure'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'flight_number': self.flight_number,
            'airline_id': self.airline_id,
            'route_id': self.route_id,
            'aircraft': self.aircraft,
            'scheduled_departure': self.scheduled_departure.isoformat() if self.scheduled_departure else None,
            'scheduled_departure_time': self.scheduled_departure_time.isoformat() if self.scheduled_departure_time else None,
            'scheduled_arrival': self.scheduled_arrival.isoformat() if self.scheduled_arrival else None,
            'scheduled_arrival_time': self.scheduled_arrival_time.isoformat() if self.scheduled_arrival_time else None,
        }

    @classmethod
    def __process_dates(cls, body):
        if 'scheduled_departure_time' in body:
            _, body['scheduled_departure_time'] = split_iso_datetime(body.get('scheduled_departure_time'))
        if 'scheduled_arrival_time' in body:
            _, body['scheduled_arrival_time'] = split_iso_datetime(body.get('scheduled_arrival_time'))

        return body

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='flight_number', descending=False)

    @classmethod
    def create(cls, **kwargs):
        kwargs = cls.__process_dates(kwargs)
        return super().create(**kwargs)
    
    @classmethod
    def update(cls, flight_id, **kwargs):
        flight = cls.get_by_id(flight_id)
        if not flight:
            return None

        kwargs = cls.__process_dates(kwargs)
        return super().update(flight_id, **kwargs)
