from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Mapped, Session
from sqlalchemy.ext.hybrid import hybrid_property


from app.database import db
from app.models.airline import Airline
from app.models.airport import Airport
from app.models.route import Route
from app.models.aircraft import Aircraft
from app.models._base_model import BaseModel, ModelValidationError
from app.models.flight_tariff import FlightTariff
from app.models.tariff import Tariff
from app.utils.xlsx import parse_xlsx, generate_xlsx_template
from app.utils.datetime import combine_date_time, parse_date, parse_time

if TYPE_CHECKING:
    from app.models.booking_flight import BookingFlight


class Flight(BaseModel):
    __tablename__ = 'flights'

    flight_number = db.Column(db.String, nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('routes.id', ondelete='RESTRICT'), nullable=False)
    airline_id = db.Column(db.Integer, db.ForeignKey('airlines.id', ondelete='RESTRICT'), nullable=False)
    aircraft_id = db.Column(db.Integer, db.ForeignKey('aircrafts.id', ondelete='RESTRICT'), nullable=True)
    note = db.Column(db.String, nullable=True)

    scheduled_departure = db.Column(db.Date, nullable=False)
    scheduled_departure_time = db.Column(db.Time, nullable=True)

    scheduled_arrival = db.Column(db.Date, nullable=False)
    scheduled_arrival_time = db.Column(db.Time, nullable=True)

    tariffs: Mapped[List[FlightTariff]] = db.relationship(
        'FlightTariff', back_populates='flight', lazy='dynamic', cascade='all, delete-orphan'
    )
    route: Mapped['Route'] = db.relationship('Route', back_populates='flights')
    airline: Mapped['Airline'] = db.relationship('Airline', back_populates='flights')
    aircraft: Mapped['Aircraft'] = db.relationship('Aircraft', back_populates='flights')
    booking_flights: Mapped[List['BookingFlight']] = db.relationship(
        'BookingFlight', back_populates='flight', lazy='dynamic', cascade='all, delete-orphan'
    )

    __table_args__ = (
        db.UniqueConstraint(
            'flight_number', 'airline_id', 'route_id', 'scheduled_departure',
            name='uix_flight_number_airline_route_departure'
        ),
    )

    @hybrid_property
    def airline_flight_number(self):
        """Return flight number prefixed with airline IATA code"""
        airline = self.airline
        return f'{airline.iata_code}{self.flight_number}' if airline else self.flight_number

    @hybrid_property
    def flight_duration(self):
        """Return flight duration in minutes"""
        if not (self.scheduled_departure and self.scheduled_arrival):
            return None

        depart_dt = combine_date_time(self.scheduled_departure, self.scheduled_departure_time)
        arrive_dt = combine_date_time(self.scheduled_arrival, self.scheduled_arrival_time)

        if depart_dt is None or arrive_dt is None:
            return None

        route = self.route
        origin = route.origin_airport
        dest = route.destination_airport

        origin_tz = origin.timezone.get_tz() if origin.timezone else None
        dest_tz = dest.timezone.get_tz() if dest.timezone else None

        if origin_tz:
            depart_dt = depart_dt.replace(tzinfo=origin_tz)
        if dest_tz:
            arrive_dt = arrive_dt.replace(tzinfo=dest_tz)

        delta = arrive_dt - depart_dt
        return int(delta.total_seconds() // 60)

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'flight_number': self.flight_number,
            'airline_flight_number': self.airline_flight_number,
            'airline': self.airline.to_dict(return_children) if return_children else {},
            'airline_id': self.airline_id,
            'route': self.route.to_dict(return_children) if return_children else {},
            'route_id': self.route_id,
            'note': self.note,
            'aircraft': self.aircraft.to_dict(return_children) if self.aircraft_id and return_children else {},
            'aircraft_id': self.aircraft_id,
            'scheduled_departure': self.scheduled_departure.isoformat() if self.scheduled_departure else None,
            'scheduled_departure_time': self.scheduled_departure_time.isoformat() if self.scheduled_departure_time else None,
            'scheduled_arrival': self.scheduled_arrival.isoformat() if self.scheduled_arrival else None,
            'scheduled_arrival_time': self.scheduled_arrival_time.isoformat() if self.scheduled_arrival_time else None,
            'duration': self.flight_duration,
        }

    MAX_TARIFFS = 4

    @classmethod
    def get_upload_fields(cls):
        fields = {
            'airline_code': 'Код авиакомпании',
            'flight_number': 'Номер рейса',
            'origin_airport_code': 'Код аэропорта отправления',
            'destination_airport_code': 'Код аэропорта прибытия',
            'aircraft': 'Воздушное судно',
            'note': 'Примечания',
            'scheduled_departure': 'Дата отправления',
            'scheduled_departure_time': 'Время отправления',
            'scheduled_arrival': 'Дата прибытия',
            'scheduled_arrival_time': 'Время прибытия',
            **{f'{key}_{i}': f'{label} {i}' for i in range(1, cls.MAX_TARIFFS + 1) for key, label in {
                'seat_class': 'Класс обслуживания',
                'seats_number': 'Количество мест',
                'tariff_number': 'Номер тарифа',
            }.items()}
        }

        return fields

    @classmethod
    def get_tariff_upload_fields(cls):
        tariff_fields = {
            'seat_class': 'Класс обслуживания',
            'seats_number': 'Количество мест',
            'tariff_number': 'Номер тарифа',
        }
        fields = {}
        for i in range(1, cls.MAX_TARIFFS + 1):
            for key, label in tariff_fields.items():
                fields[f'{key}_{i}'] = f'{label} {i}'
        return fields

    @classmethod
    def get_upload_date_fields(cls):
        return [
            'scheduled_departure',
            'scheduled_arrival',
        ]

    @classmethod
    def get_upload_time_fields(cls):
        return [
            'scheduled_departure_time',
            'scheduled_arrival_time',
        ]

    @classmethod
    def get_upload_text_fields(cls):
        return [
            'airline_code',
            'flight_number',
            'origin_airport_code',
            'destination_airport_code',
            'aircraft',
            'note',
            *[f'{key}_{i}' for i in range(1, cls.MAX_TARIFFS + 1) for key in ['seat_class']]
        ]

    @classmethod
    def get_xlsx_template(cls):
        return generate_xlsx_template(
            cls.get_upload_fields(), date_fields=cls.get_upload_date_fields(),
            time_fields=cls.get_upload_time_fields(),
            text_fields=cls.get_upload_text_fields()
        )

    @classmethod
    def upload_from_file(
        cls,
        file,
        session: Session | None = None,
    ):
        session = session or db.session
        rows = parse_xlsx(
            file,
            cls.get_upload_fields(),
            required_fields=[
                'airline_code',
                'flight_number',
                'origin_airport_code',
                'destination_airport_code',
                'scheduled_departure',
                'scheduled_arrival',
            ],
            date_fields=cls.get_upload_date_fields(),
            time_fields=cls.get_upload_time_fields(),
        )

        flights = []
        error_rows = []

        for row in rows:
            if not row.get('error'):
                try:
                    airline = Airline.get_by_code(row.get('airline_code'))
                    if not airline:
                        raise ValueError('Invalid airline code')

                    origin = Airport.get_by_code(row.get('origin_airport_code'))
                    if not origin:
                        raise ValueError('Invalid origin airport code')

                    destination = Airport.get_by_code(row.get('destination_airport_code'))
                    if not destination:
                        raise ValueError('Invalid destination airport code')

                    route = Route.query.filter(
                        Route.origin_airport_id == origin.id,
                        Route.destination_airport_id == destination.id,
                    ).one_or_none()
                    if not route:
                        raise ValueError('Route does not exist')

                    aircraft_id = None
                    aircraft_type = row.get('aircraft')
                    if aircraft_type:
                        aircraft = Aircraft.query.filter_by(type=aircraft_type).one_or_none()
                        aircraft_id = aircraft.id if aircraft else None

                    flight = cls.create(
                        session,
                        flight_number=str(row.get('flight_number')),
                        airline_id=airline.id,
                        route_id=route.id,
                        aircraft_id=aircraft_id,
                        note=row.get('note'),
                        scheduled_departure=parse_date(row.get('scheduled_departure')),
                        scheduled_departure_time=parse_time(row.get('scheduled_departure_time')),
                        scheduled_arrival=parse_date(row.get('scheduled_arrival')),
                        scheduled_arrival_time=parse_time(row.get('scheduled_arrival_time')),
                        commit=False,
                    )

                    used_tariffs = {}
                    for i in range(1, cls.MAX_TARIFFS + 1):
                        seat_class = row.get(f'seat_class_{i}')
                        seats_number = int(row.get(f'seats_number_{i}', 0) or 0)
                        tariff_number = int(row.get(f'tariff_number_{i}', 0) or 0)
                        if not (seat_class or seats_number or tariff_number):
                            continue
                        if not (seat_class and seats_number >= 0 and tariff_number > 0):
                            raise ValueError(f'Incomplete tariff data in group {i}')
                        if seat_class in used_tariffs and tariff_number in used_tariffs[seat_class]:
                            raise ValueError('Duplicate tariff')
                        used_tariffs.setdefault(seat_class, set()).add(tariff_number)
                        tariff = Tariff.query.filter(
                            Tariff.seat_class == seat_class,
                            Tariff.order_number == tariff_number
                        ).one_or_none()
                        if not tariff:
                            raise ValueError(f'Invalid tariff number or class: {seat_class}, {tariff_number}')
                        FlightTariff.create(
                            session,
                            flight_id=flight.id,
                            tariff_id=tariff.id,
                            seats_number=seats_number,
                            commit=False,
                        )

                    flights.append(flight)
                except Exception as e:
                    row['error'] = str(e)

            if row.get('error'):
                error_rows.append(row)

        session.commit()

        return flights, error_rows

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['scheduled_departure', 'scheduled_departure_time'], descending=True)

    @classmethod
    def _check_flight_uniqueness(cls, session, flight_number, airline_id, route_id, scheduled_departure, exclude_id=None):
        if not (flight_number and airline_id and route_id and scheduled_departure):
            return
        query = session.query(cls)
        if exclude_id is not None:
            query = query.filter(cls.id != exclude_id)
            existing_flight = query.filter(
                cls.flight_number == flight_number,
                cls.airline_id == airline_id,
                cls.route_id == route_id,
                cls.scheduled_departure == scheduled_departure
            ).one_or_none()
        else:
            existing_flight = query.filter(
                cls.flight_number == flight_number,
                cls.airline_id == airline_id,
                cls.route_id == route_id,
                cls.scheduled_departure == scheduled_departure
            ).one_or_none()
        if existing_flight:
            raise ModelValidationError(
                {'flight_number': 'Flight with this number already exists for the given airline and route.'})

    @classmethod
    def create(
        cls,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session
        flight_number = kwargs.get('flight_number')
        airline_id = kwargs.get('airline_id')
        route_id = kwargs.get('route_id')
        scheduled_departure = kwargs.get('scheduled_departure')
        cls._check_flight_uniqueness(
            session, flight_number, airline_id, route_id, scheduled_departure
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
        flight_number = kwargs.get('flight_number')
        airline_id = kwargs.get('airline_id')
        route_id = kwargs.get('route_id')
        scheduled_departure = kwargs.get('scheduled_departure')
        cls._check_flight_uniqueness(
            session, flight_number, airline_id, route_id, scheduled_departure, exclude_id=_id
        )
        return super().update(_id, session, commit=commit, **kwargs)
