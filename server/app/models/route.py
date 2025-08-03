from app.database import db
from app.models._base_model import BaseModel
from app.models.airport import Airport


class Route(BaseModel):
    __tablename__ = 'routes'

    origin_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)
    destination_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)

    origin_airport: Airport = db.relationship('Airport', foreign_keys=[origin_airport_id], backref=db.backref('origin_routes', lazy=True))
    destination_airport: Airport = db.relationship('Airport', foreign_keys=[destination_airport_id], backref=db.backref('destination_routes', lazy=True))

    __table_args__ = (
        db.UniqueConstraint(
            'origin_airport_id', 'destination_airport_id',
            name='uix_origin_destination_airport'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'origin_airport_id': self.origin_airport_id,
            'destination_airport_id': self.destination_airport_id
        }
