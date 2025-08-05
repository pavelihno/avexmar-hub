from datetime import datetime, time, date
from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Mapped, Session
from sqlalchemy.ext.hybrid import hybrid_property


from app.database import db
from app.models.airline import Airline
from app.models.airport import Airport
from app.models.route import Route
from app.models.timezone import Timezone
from app.models.aircraft import Aircraft
from app.models._base_model import BaseModel, ModelValidationError
from app.models.flight_tariff import FlightTariff
from app.models.tariff import Tariff
from app.utils.xlsx import parse_xlsx, generate_xlsx_template

if TYPE_CHECKING:
    from app.models.ticket import Ticket


class Flight(BaseModel):
    __tablename__ = 'flights'

    flight_number = db.Column(db.String, nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('routes.id', ondelete='RESTRICT'), nullable=False)
    airline_id = db.Column(db.Integer, db.ForeignKey('airlines.id', ondelete='RESTRICT'), nullable=False)
    aircraft_id = db.Column(db.Integer, db.ForeignKey('aircrafts.id', ondelete='RESTRICT'), nullable=True)

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
    tickets: Mapped[List['Ticket']] = db.relationship(
        'Ticket', back_populates='flight', lazy='dynamic', cascade='all, delete-orphan'
    )

    upload_fields = {
        'airline_code': 'Код авиакомпании',
        'flight_number': 'Номер рейса',
        'origin_airport_code': 'Код аэропорта отправления',
        'destination_airport_code': 'Код аэропорта прибытия',
        'aircraft': 'Воздушное судно',
        'scheduled_departure': 'Дата отправления',
        'scheduled_departure_time': 'Время отправления',
        'scheduled_arrival': 'Дата прибытия',
        'scheduled_arrival_time': 'Время прибытия',
    }

    tariff_upload_fields = {
        'seat_class': 'Класс обслуживания',
        'seats_number': 'Количество мест',
        'tariff_number': 'Номер тарифа',
    }

    MAX_TARIFFS = 3

    @classmethod
    def get_upload_fields(cls):
        fields = {**cls.upload_fields}
        for i in range(1, cls.MAX_TARIFFS + 1):
            for key, label in cls.tariff_upload_fields.items():
                fields[f"{key}_{i}"] = f"{label} {i}"
        return fields

    @classmethod
    def get_xlsx_template(cls):
        return generate_xlsx_template(cls.get_upload_fields())

    @classmethod
    def upload_from_file(cls, file, session: Session | None = None):
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
                'scheduled_departure_time',
                'scheduled_arrival',
                'scheduled_arrival_time',
            ],
        )

        flights = []
        error_rows = []

        for row in rows:
            if not row.get('error'):
                try:
                    airline = Airline.query.filter_by(iata_code=row.get('airline_code')).first()
                    if not airline:
                        raise ValueError('Invalid airline code')

                    origin = Airport.query.filter_by(iata_code=row.get('origin_airport_code')).first()
                    if not origin:
                        raise ValueError('Invalid origin airport code')

                    destination = Airport.query.filter_by(iata_code=row.get('destination_airport_code')).first()
                    if not destination:
                        raise ValueError('Invalid destination airport code')

                    route = Route.query.filter_by(
                        origin_airport_id=origin.id,
                        destination_airport_id=destination.id,
                    ).first()
                    if not route:
                        route = Route.create(
                            session,
                            origin_airport_id=origin.id,
                            destination_airport_id=destination.id,
                        )

                    dep_date = row.get('scheduled_departure')
                    if isinstance(dep_date, datetime):
                        dep_date = dep_date.date()
                    arr_date = row.get('scheduled_arrival')
                    if isinstance(arr_date, datetime):
                        arr_date = arr_date.date()
                    dep_time = row.get('scheduled_departure_time')
                    if isinstance(dep_time, datetime):
                        dep_time = dep_time.time()
                    arr_time = row.get('scheduled_arrival_time')
                    if isinstance(arr_time, datetime):
                        arr_time = arr_time.time()

                    flight = cls.create(
                        session,
                        flight_number=row.get('flight_number'),
                        airline_id=airline.id,
                        route_id=route.id,
                        aircraft=row.get('aircraft'),
                        scheduled_departure=dep_date,
                        scheduled_departure_time=dep_time,
                        scheduled_arrival=arr_date,
                        scheduled_arrival_time=arr_time,
                    )

                    used_classes = set()
                    for i in range(1, cls.MAX_TARIFFS + 1):
                        seat_class = row.get(f'seat_class_{i}')
                        seats = row.get(f'seats_number_{i}')
                        tariff_number = row.get(f'tariff_number_{i}')
                        if not (seat_class or seats or tariff_number):
                            continue
                        if not (seat_class and seats and tariff_number):
                            raise ValueError(f'Incomplete tariff data in group {i}')
                        if seat_class in used_classes:
                            raise ValueError('Duplicate service class')
                        used_classes.add(seat_class)
                        tariff = Tariff.query.filter_by(
                            seat_class=seat_class, order_number=int(tariff_number)
                        ).first()
                        if not tariff:
                            raise ValueError('Invalid tariff number or class')
                        FlightTariff.create(
                            session,
                            flight_id=flight.id,
                            tariff_id=tariff.id,
                            seats_number=int(seats),
                        )

                    flights.append(flight)
                except Exception as e:
                    row['error'] = str(e)

            if row.get('error'):
                error_rows.append(row)

        return flights, error_rows

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

        depart_dt = datetime.combine(
            self.scheduled_departure,
            self.scheduled_departure_time or time()
        )
        arrive_dt = datetime.combine(
            self.scheduled_arrival,
            self.scheduled_arrival_time or time()
        )

        route = self.route
        origin = route.origin_airport
        dest = route.destination_airport

        origin_tz = origin.timezone.get_tz() if origin.timezone else None
        dest_tz = dest.timezone.get_tz() if dest.timezone else None

        if origin_tz is not None and dest_tz is not None:
            depart_dt = depart_dt.astimezone(origin_tz)
            arrive_dt = arrive_dt.astimezone(dest_tz)

            delta = arrive_dt - depart_dt

            return int(delta.total_seconds() // 60)

        return 0

    def to_dict(self):
        return {
            'id': self.id,
            'flight_number': self.flight_number,
            'airline_flight_number': self.airline_flight_number,
            'airline_id': self.airline_id,
            'route_id': self.route_id,
            'aircraft_id': self.aircraft_id,
            'aircraft_type': self.aircraft.type if self.aircraft else None,
            'scheduled_departure': self.scheduled_departure.isoformat() if self.scheduled_departure else None,
            'scheduled_departure_time': self.scheduled_departure_time.isoformat() if self.scheduled_departure_time else None,
            'scheduled_arrival': self.scheduled_arrival.isoformat() if self.scheduled_arrival else None,
            'scheduled_arrival_time': self.scheduled_arrival_time.isoformat() if self.scheduled_arrival_time else None,
            'duration': self.flight_duration,
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='flight_number', descending=False)

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
            ).first()
        else:
            existing_flight = query.filter_by(
                flight_number=flight_number,
                airline_id=airline_id,
                route_id=route_id,
                scheduled_departure=scheduled_departure
            ).first()
        if existing_flight:
            print(existing_flight.to_dict())
            raise ModelValidationError(
                {'flight_number': 'Flight with this number already exists for the given airline and route.'})
    
    @classmethod
    def create(cls, session=None, **data):
        session = session or db.session
        flight_number = data.get('flight_number')
        airline_id = data.get('airline_id')
        route_id = data.get('route_id')
        scheduled_departure = data.get('scheduled_departure')
        cls._check_flight_uniqueness(session, flight_number, airline_id, route_id, scheduled_departure)
        return super().create(session, **data)

    @classmethod
    def update(cls, _id, session=None, **data):
        session = session or db.session
        flight_number = data.get('flight_number')
        airline_id = data.get('airline_id')
        route_id = data.get('route_id')
        scheduled_departure = data.get('scheduled_departure')
        cls._check_flight_uniqueness(session, flight_number, airline_id, route_id, scheduled_departure, exclude_id=_id)
        return super().update(_id, session, **data)
