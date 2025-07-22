from app.database import db
from app.models._base_model import BaseModel, ModelValidationError
from app.models.tariff import Tariff


class FlightTariff(BaseModel):
    __tablename__ = 'flight_tariffs'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    tariff_id = db.Column(db.Integer, db.ForeignKey('tariffs.id', ondelete='CASCADE'), nullable=False)
    seats_number = db.Column(db.Integer, nullable=False)

    @classmethod
    def __check_seat_class_unique(cls, session, flight_id, tariff_id, instance_id=None):
        """Ensure only one tariff per flight for the same seat class"""
        tariff = Tariff.get_by_id(tariff_id)
        if not tariff:
            return

        query = session.query(cls).join(Tariff, cls.tariff_id == Tariff.id)
        query = query.filter(cls.flight_id == flight_id, Tariff.seat_class == tariff.seat_class)
        if instance_id is not None:
            query = query.filter(cls.id != instance_id)
        if query.first() is not None:
            raise ModelValidationError({'seat_class': 'flight tariff for this class already exists'})

    def to_dict(self):
        return {
            'id': self.id,
            'flight_id': self.flight_id,
            'tariff_id': self.tariff_id,
            'seats_number': self.seats_number
        }

    @classmethod
    def create(cls, session=None, **data):
        session = session or db.session
        flight_id = data.get('flight_id')
        tariff_id = data.get('tariff_id')
        if flight_id is not None and tariff_id is not None:
            cls.__check_seat_class_unique(session, flight_id, tariff_id)
        return super().create(session, **data)

    @classmethod
    def update(cls, _id, session=None, **data):
        session = session or db.session
        instance = cls.get_by_id(_id)
        if not instance:
            return None

        flight_id = data.get('flight_id', instance.flight_id)
        tariff_id = data.get('tariff_id', instance.tariff_id)
        if flight_id is not None and tariff_id is not None:
            cls.__check_seat_class_unique(session, flight_id, tariff_id, instance_id=_id)

        return super().update(_id, session, **data)
