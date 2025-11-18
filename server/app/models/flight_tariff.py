from typing import TYPE_CHECKING, List

from sqlalchemy import func
from sqlalchemy.orm import Mapped, Session

from app.constants.messages import FlightTariffMessages
from app.database import db
from app.models._base_model import BaseModel, ModelValidationError
from app.models.tariff import Tariff
from app.utils.enum import SEAT_CLASS

if TYPE_CHECKING:
    from app.models.flight import Flight
    from app.models.booking_flight import BookingFlight


class FlightTariff(BaseModel):
    __tablename__ = 'flight_tariffs'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    tariff_id = db.Column(db.Integer, db.ForeignKey('tariffs.id', ondelete='CASCADE'), nullable=False)
    seats_number = db.Column(db.Integer, nullable=False)

    flight: Mapped['Flight'] = db.relationship('Flight', back_populates='tariffs')
    tariff: Mapped['Tariff'] = db.relationship('Tariff', back_populates='flight_tariffs')
    booking_flights: Mapped[List['BookingFlight']] = db.relationship(
        'BookingFlight',
        back_populates='flight_tariff',
        lazy='dynamic',
        cascade='all, delete-orphan',
    )

    __table_args__ = (
        db.UniqueConstraint('flight_id', 'tariff_id', name='uix_flight_tariff_flight_tariff'),
    )

    def to_dict(self, return_children=False):
        from app.utils.search import get_flight_seat_availability

        availability_map = get_flight_seat_availability(
            self.flight_id,
            self.id,
        )

        availability = availability_map.get(self.id, {}) if availability_map else {}

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

        seats_number = kwargs.get('seats_number')
        seats_number_int = None
        if seats_number is not None:
            seats_number_int = cls._prepare_seats_number(seats_number)
            kwargs['seats_number'] = seats_number_int

        flight_id = kwargs.get('flight_id')
        seat_class = cls._get_seat_class(session, kwargs)
        if flight_id and seat_class and seats_number_int is not None:
            cls._validate_aircraft_capacity(
                session,
                flight_id,
                seat_class,
                seats_number_int,
            )

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
            taken = availability_map.get(instance.id, {}).get('taken', 0)
            kwargs['seats_number'] = seats_available_int + taken

        seats_number = kwargs.get('seats_number')
        if seats_number is not None:
            seats_number_int = cls._prepare_seats_number(seats_number)
            kwargs['seats_number'] = seats_number_int
        else:
            seats_number_int = instance.seats_number

        flight_id = kwargs.get('flight_id', instance.flight_id)
        seat_class = cls._get_seat_class(session, kwargs, default=instance.tariff.seat_class if instance.tariff else None)
        if flight_id and seat_class and seats_number_int is not None:
            cls._validate_aircraft_capacity(
                session,
                flight_id,
                seat_class,
                seats_number_int,
                exclude_id=_id,
            )

        return super().update(_id, session, commit=commit, **kwargs)

    @staticmethod
    def _prepare_seats_number(value):
        try:
            seats_int = int(value)
        except (TypeError, ValueError) as exc:
            raise ModelValidationError({
                'seats_number': FlightTariffMessages.INVALID_TOTAL_SEATS,
            }) from exc
        if seats_int < 0:
            raise ModelValidationError({
                'seats_number': FlightTariffMessages.TOTAL_SEATS_MUST_BE_NON_NEGATIVE,
            })
        return seats_int

    @classmethod
    def _get_seat_class(cls, session: Session, kwargs, default: SEAT_CLASS | None = None):
        seat_class_value = kwargs.get('seat_class')
        seat_class_enum = None
        if seat_class_value is not None:
            try:
                seat_class_enum = SEAT_CLASS(seat_class_value)
            except (TypeError, ValueError):
                seat_class_enum = None
        if 'tariff_id' in kwargs and kwargs.get('tariff_id') is not None:
            tariff = session.get(Tariff, kwargs.get('tariff_id'))
            if tariff:
                seat_class_enum = tariff.seat_class
        if seat_class_enum is None:
            seat_class_enum = default
        return seat_class_enum

    @classmethod
    def _validate_aircraft_capacity(
        cls,
        session: Session,
        flight_id: int,
        seat_class: SEAT_CLASS,
        seats_number: int,
        *,
        exclude_id: int | None = None,
    ) -> None:
        from app.models.flight import Flight

        flight = session.get(Flight, flight_id)
        if not flight or not flight.aircraft:
            return

        aircraft = flight.aircraft
        capacity = aircraft.get_capacity_for_seat_class(seat_class)
        if capacity is None:
            return

        query = session.query(func.coalesce(func.sum(cls.seats_number), 0)).join(Tariff).filter(
            cls.flight_id == flight_id,
            Tariff.seat_class == seat_class,
        )
        if exclude_id is not None:
            query = query.filter(cls.id != exclude_id)

        allocated = query.scalar() or 0
        total_requested = allocated + seats_number

        if total_requested > capacity:
            raise ModelValidationError({
                'seats_number': FlightTariffMessages.seats_exceed_aircraft_capacity(
                    seat_class.value if isinstance(seat_class, SEAT_CLASS) else str(seat_class),
                    aircraft.type,
                    capacity,
                    total_requested,
                )
            })
