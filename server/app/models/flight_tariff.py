from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, Session

from app.constants.messages import FlightTariffMessages
from app.database import db
from app.models._base_model import BaseModel, ModelValidationError
from app.models.tariff import Tariff

if TYPE_CHECKING:
    from app.models.flight import Flight


class FlightTariff(BaseModel):
    __tablename__ = 'flight_tariffs'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    tariff_id = db.Column(db.Integer, db.ForeignKey('tariffs.id', ondelete='CASCADE'), nullable=False)
    seats_number = db.Column(db.Integer, nullable=False)

    flight: Mapped['Flight'] = db.relationship('Flight', back_populates='tariffs')
    tariff: Mapped['Tariff'] = db.relationship('Tariff', back_populates='flight_tariffs')

    __table_args__ = (
        db.UniqueConstraint('flight_id', 'tariff_id', name='uix_flight_tariff_flight_tariff'),
    )

    def to_dict(self, return_children=False):
        from app.utils.search import get_flight_seat_availability

        availability_map = get_flight_seat_availability(
            self.flight_id, self.tariff_id
        )

        availability = availability_map.get(self.tariff_id, {}) if availability_map else {}

        total_seats = availability.get('total', self.seats_number or 0)
        taken_seats = availability.get('taken', 0)
        available_seats = availability.get('available', max(total_seats - taken_seats, 0))

        return {
            'id': self.id,
            'flight': self.flight.to_dict(return_children) if return_children else {},
            'flight_id': self.flight_id,
            'tariff': self.tariff.to_dict(return_children) if return_children else {},
            'tariff_id': self.tariff_id,
            'seats_number': total_seats,
            'taken_seats': taken_seats,
            'available_seats': available_seats,
        }

    @classmethod
    def create(
        cls,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session
        available_seats = kwargs.pop('available_seats', None)
        if available_seats is not None:
            try:
                seats_available_int = int(available_seats)
            except (TypeError, ValueError) as exc:
                raise ModelValidationError({
                    'available_seats': FlightTariffMessages.INVALID_AVAILABLE_SEATS,
                }) from exc
            if seats_available_int < 0:
                raise ModelValidationError({
                    'available_seats': FlightTariffMessages.AVAILABLE_SEATS_MUST_BE_NON_NEGATIVE,
                })
            kwargs['seats_number'] = seats_available_int

        return super().create(session, commit=commit, **kwargs)

    @classmethod
    def update(
        cls,
        _id,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session
        instance = cls.get_or_404(_id, session)
        available_seats = kwargs.pop('available_seats', None)
        if available_seats is not None:
            try:
                seats_available_int = int(available_seats)
            except (TypeError, ValueError) as exc:
                raise ModelValidationError({
                    'available_seats': FlightTariffMessages.INVALID_AVAILABLE_SEATS,
                }) from exc
            if seats_available_int < 0:
                raise ModelValidationError({
                    'available_seats': FlightTariffMessages.AVAILABLE_SEATS_MUST_BE_NON_NEGATIVE,
                })

            from app.utils.search import get_flight_seat_availability
            
            availability_map = get_flight_seat_availability(
                instance.flight_id,
                session=session,
                flight_tariffs=[instance],
            )
            taken = availability_map.get(instance.tariff_id, {}).get('taken', 0)
            kwargs['seats_number'] = seats_available_int + taken

        return super().update(_id, session, commit=commit, **kwargs)
