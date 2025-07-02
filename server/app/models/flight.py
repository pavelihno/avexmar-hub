from database import db
from models._base_model import BaseModel
from config import Config


class Flight(BaseModel):
    __tablename__ = 'flights'

    route_id = db.Column(db.Integer, db.ForeignKey('routes.id', ondelete='CASCADE'), nullable=False)
    scheduled_departure = db.Column(db.DateTime, nullable=True)
    scheduled_arrival = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String, nullable=False, default=Config.DEFAULT_FLIGHT_STATUS, server_default=Config.DEFAULT_FLIGHT_STATUS)

    tariffs = db.relationship('Tariff', backref='flight', lazy='dynamic', cascade='all, delete-orphan')
    bookings = db.relationship('Booking', backref='flight', lazy='dynamic', cascade='all, delete-orphan')
    seats = db.relationship('Seat', backref='flight', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.CheckConstraint(status.in_(Config.ENUM_FLIGHT_STATUS), name='flight_status_types'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'route_id': self.route_id,
            'scheduled_departure': self.scheduled_departure,
            'scheduled_arrival': self.scheduled_arrival,
            'status': self.status
        }
