from app.database import db
from app.models._base_model import BaseModel, ModelValidationError
from datetime import datetime, time
from zoneinfo import ZoneInfo


class Flight(BaseModel):
    __tablename__ = 'flights'

    flight_number = db.Column(db.String, nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('routes.id', ondelete='RESTRICT'), nullable=False)
    airline_id = db.Column(db.Integer, db.ForeignKey('airlines.id', ondelete='RESTRICT'), nullable=False)
    aircraft = db.Column(db.String, nullable=True)

    scheduled_departure = db.Column(db.Date, nullable=False)
    scheduled_departure_time = db.Column(db.Time, nullable=True)

    scheduled_arrival = db.Column(db.Date, nullable=False)
    scheduled_arrival_time = db.Column(db.Time, nullable=True)

    tariffs = db.relationship('FlightTariff', backref=db.backref('flight', lazy=True), lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint(
            'flight_number', 'airline_id', 'route_id', 'scheduled_departure',
            name='uix_flight_number_airline_route_departure'
        ),
    )

    def get_duration_minutes(self):
        """Return flight duration in minutes.

        If related airports provide a ``timezone`` relationship, its ``name`` is used
        for
        timezone-aware calculation. Otherwise the duration is calculated as a
        naive difference between scheduled arrival and departure times.
        """
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

        origin_tz = None
        dest_tz = None

        route = getattr(self, 'route', None)
        if route is not None:
            origin = getattr(route, 'origin_airport', None)
            dest = getattr(route, 'destination_airport', None)
            origin_tz = (
                origin.timezone.name if getattr(origin, 'timezone', None) else None
            )
            dest_tz = (
                dest.timezone.name if getattr(dest, 'timezone', None) else None
            )

        if origin_tz:
            try:
                depart_dt = depart_dt.replace(tzinfo=ZoneInfo(origin_tz))
            except Exception:
                pass
        if dest_tz:
            try:
                arrive_dt = arrive_dt.replace(tzinfo=ZoneInfo(dest_tz))
            except Exception:
                pass

        delta = arrive_dt - depart_dt
        return int(delta.total_seconds() // 60)

    def to_dict(self):
        return {
            'id': self.id,
            'flight_number': self.flight_number,
            'airline_id': self.airline_id,
            'route_id': self.route_id,
            'aircraft': self.aircraft,
            'scheduled_departure': self.scheduled_departure.isoformat() if self.scheduled_departure else None,
            'scheduled_departure_time': self.scheduled_departure_time.isoformat() if self.scheduled_departure_time else None,
            'scheduled_arrival': self.scheduled_arrival.isoformat() if self.scheduled_arrival else None,
            'scheduled_arrival_time': self.scheduled_arrival_time.isoformat() if self.scheduled_arrival_time else None,
            'duration': self.get_duration_minutes(),
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
