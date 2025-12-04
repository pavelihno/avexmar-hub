from app.database import db
from app.models._base_model import BaseModel, ModelValidationError
from app.constants.messages import AircraftMessages
from app.constants.models import ModelVerboseNames
from app.utils.enum import SEAT_CLASS


class Aircraft(BaseModel):
    __tablename__ = 'aircrafts'
    __verbose_name__ = ModelVerboseNames.Aircraft

    type = db.Column(db.String, nullable=False, unique=True)
    economy_seats = db.Column(db.Integer, nullable=False, default=0)
    business_seats = db.Column(db.Integer, nullable=False, default=0)

    flights = db.relationship('Flight', back_populates='aircraft', lazy='dynamic')

    _SEAT_FIELDS = ('economy_seats', 'business_seats')
    _SEAT_CLASS_FIELD_MAP = {
        SEAT_CLASS.economy: 'economy_seats',
        SEAT_CLASS.business: 'business_seats',
    }

    @staticmethod
    def _validate_seat_value(value, field_name):
        if value in (None, ''):
            return 0
        try:
            seats = int(value)
        except (TypeError, ValueError) as exc:
            raise ModelValidationError({field_name: AircraftMessages.INVALID_SEAT_NUMBER}) from exc

        if seats < 0:
            raise ModelValidationError({field_name: AircraftMessages.SEATS_MUST_BE_NON_NEGATIVE})

        return seats

    @classmethod
    def _prepare_seat_values(cls, kwargs):
        cleaned = {}
        for field in cls._SEAT_FIELDS:
            if field in kwargs:
                cleaned[field] = cls._validate_seat_value(kwargs[field], field)
        return cleaned

    @staticmethod
    def resolve_seat_class(seat_class):
        if isinstance(seat_class, SEAT_CLASS):
            return seat_class
        try:
            return SEAT_CLASS(seat_class)
        except (TypeError, ValueError):
            return None

    def get_capacity_for_seat_class(self, seat_class):
        seat_class_enum = self.resolve_seat_class(seat_class)
        if seat_class_enum is None:
            return None
        field_name = self._SEAT_CLASS_FIELD_MAP.get(seat_class_enum)
        if not field_name:
            return None
        return getattr(self, field_name, None)

    @classmethod
    def create(
        cls,
        session=None,
        *,
        commit=False,
        **kwargs,
    ):
        kwargs.update(cls._prepare_seat_values(kwargs))
        return super().create(session, commit=commit, **kwargs)

    @classmethod
    def update(
        cls,
        _id,
        session=None,
        *,
        commit=False,
        **kwargs,
    ):
        kwargs.update(cls._prepare_seat_values(kwargs))
        return super().update(_id, session, commit=commit, **kwargs)

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'type': self.type,
            'economy_seats': self.economy_seats,
            'business_seats': self.business_seats,
        }
