from app.database import db
from app.models._base_model import BaseModel
from app.config import Config


class Flight(BaseModel):
    __tablename__ = 'flights'

    route_id = db.Column(db.Integer, db.ForeignKey('routes.id', ondelete='RESTRICT'), nullable=False)
    airline_id = db.Column(db.Integer, db.ForeignKey('airlines.id', ondelete='RESTRICT'), nullable=False)
    scheduled_departure = db.Column(db.DateTime, nullable=True)
    scheduled_arrival = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.Enum(Config.FLIGHT_STATUS), nullable=False, default=Config.DEFAULT_FLIGHT_STATUS)

    tariffs = db.relationship('Tariff', backref=db.backref('flight', lazy=True), lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'route_id': self.route_id,
            'scheduled_departure': self.scheduled_departure.isoformat() if self.scheduled_departure else None,
            'scheduled_arrival': self.scheduled_arrival.isoformat() if self.scheduled_arrival else None,
            'status': self.status.value
        }
