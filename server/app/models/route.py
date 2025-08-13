from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.models.airport import Airport

if TYPE_CHECKING:
    from app.models.flight import Flight


class Route(BaseModel):
    __tablename__ = 'routes'

    origin_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)
    destination_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)

    origin_airport: Mapped['Airport'] = db.relationship(
        'Airport', foreign_keys=[origin_airport_id], back_populates='origin_routes'
    )
    destination_airport: Mapped['Airport'] = db.relationship(
        'Airport', foreign_keys=[destination_airport_id], back_populates='destination_routes'
    )
    flights: Mapped[List['Flight']] = db.relationship('Flight', back_populates='route', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint(
            'origin_airport_id', 'destination_airport_id',
            name='uix_origin_destination_airport'
        ),
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'origin_airport': self.origin_airport.to_dict(return_children) if return_children else {},
            'origin_airport_id': self.origin_airport_id,
            'destination_airport': self.destination_airport.to_dict(return_children) if return_children else {},
            'destination_airport_id': self.destination_airport_id,
        }
