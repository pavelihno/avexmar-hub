from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel, ModelValidationError
from app.models.tariff import Tariff

if TYPE_CHECKING:
    from app.models.flight import Flight
    from app.models.seat import Seat


class FlightTariff(BaseModel):
    __tablename__ = 'flight_tariffs'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    tariff_id = db.Column(db.Integer, db.ForeignKey('tariffs.id', ondelete='CASCADE'), nullable=False)
    seats_number = db.Column(db.Integer, nullable=False)

    flight: Mapped['Flight'] = db.relationship('Flight', back_populates='tariffs')
    tariff: Mapped['Tariff'] = db.relationship('Tariff', back_populates='flight_tariffs')
    seats: Mapped[List['Seat']] = db.relationship('Seat', back_populates='tariff', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint('flight_id', 'tariff_id', name='uix_flight_tariff_flight_tariff'),
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'flight': self.flight.to_dict(return_children) if return_children else {},
            'flight_id': self.flight_id,
            'tariff': self.tariff.to_dict(return_children) if return_children else {},
            'tariff_id': self.tariff_id,
            'seats_number': self.seats_number
        }

    @classmethod
    def __check_seat_class_unique(cls, session, flight_id, tariff_id, instance_id=None):
        """Ensure only one tariff per flight for the same seat class"""
        tariff = Tariff.get_or_404(tariff_id, session)
        query = session.query(cls).join(Tariff, cls.tariff_id == Tariff.id)
        query = query.filter(cls.flight_id == flight_id, Tariff.seat_class == tariff.seat_class)
        if instance_id is not None:
            query = query.filter(cls.id != instance_id)
        if query.one_or_none() is not None:
            raise ModelValidationError({'seat_class': 'flight tariff for this class already exists'})

    @classmethod
    def create(cls, session=None, **kwargs):
        session = session or db.session
        # Deprecated
        # flight_id = kwargs.get('flight_id')
        # tariff_id = kwargs.get('tariff_id')
        # if flight_id is not None and tariff_id is not None:
        #     cls.__check_seat_class_unique(session, flight_id, tariff_id)
        return super().create(session, **kwargs)

    @classmethod
    def update(cls, _id, session=None, **kwargs):
        session = session or db.session
        instance = cls.get_or_404(_id, session)
        # Deprecated
        # flight_id = kwargs.get('flight_id', instance.flight_id)
        # tariff_id = kwargs.get('tariff_id', instance.tariff_id)
        # if flight_id is not None and tariff_id is not None:
            # cls.__check_seat_class_unique(session, flight_id, tariff_id, instance_id=_id)

        return super().update(_id, session, **kwargs)
