import random
import string
import uuid

from uuid import UUID as UUID_cls
from typing import List, TYPE_CHECKING
from datetime import datetime
from sqlalchemy.orm import Session, Mapped
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import db
from app.models._base_model import BaseModel
from app.constants.messages import BookingMessages
from app.constants.models import ModelVerboseNames
from app.utils.enum import (
    USER_ROLE,
    BOOKING_STATUS,
    CURRENCY,
    DEFAULT_BOOKING_STATUS,
    DEFAULT_CURRENCY,
)
from app.utils.business_logic import build_booking_passenger_snapshot, build_booking_snapshot

if TYPE_CHECKING:
    from app.models.payment import Payment
    from app.models.booking_passenger import BookingPassenger
    from app.models.booking_flight import BookingFlight
    from app.models.user import User
    from app.models.consent import ConsentEvent
    from app.models.booking_hold import BookingHold


class Booking(BaseModel):
    __tablename__ = 'bookings'
    __verbose_name__ = ModelVerboseNames.Booking

    # Booking details
    public_id = db.Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True)
    access_token = db.Column(UUID(as_uuid=True), unique=True, nullable=True)
    booking_number = db.Column(db.String, unique=True, nullable=True, index=True)
    status = db.Column(db.Enum(BOOKING_STATUS), nullable=False, default=DEFAULT_BOOKING_STATUS)
    status_history = db.Column(JSONB, nullable=False, server_default='[]', default=list)

    # Customer details
    buyer_last_name = db.Column(db.String, nullable=True)
    buyer_first_name = db.Column(db.String, nullable=True)
    email_address = db.Column(db.String, nullable=True)
    phone_number = db.Column(db.String, nullable=True)

    # Price details
    currency = db.Column(db.Enum(CURRENCY), nullable=False, default=DEFAULT_CURRENCY)
    fare_price = db.Column(db.Float, nullable=False)
    fees = db.Column(db.Float, nullable=False, default=0.0)
    total_discounts = db.Column(db.Float, nullable=False, default=0.0)
    total_price = db.Column(db.Float, nullable=False)

    # Metadata
    passenger_counts = db.Column(JSONB, nullable=False, server_default='{}', default=dict)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    details_snapshot = db.Column(JSONB, nullable=True)

    # Relationships
    user: Mapped['User'] = db.relationship('User', back_populates='bookings')
    payments: Mapped[List['Payment']] = db.relationship(
        'Payment',
        back_populates='booking',
        lazy='dynamic',
        cascade='all, delete-orphan',
    )
    booking_passengers: Mapped[List['BookingPassenger']] = db.relationship(
        'BookingPassenger',
        back_populates='booking',
        lazy='dynamic',
        cascade='all, delete-orphan',
    )
    booking_flights: Mapped[List['BookingFlight']] = db.relationship(
        'BookingFlight',
        back_populates='booking',
        lazy='dynamic',
        cascade='all, delete-orphan',
    )
    booking_hold: Mapped['BookingHold'] = db.relationship(
        'BookingHold', back_populates='booking', uselist=False, cascade='all, delete-orphan'
    )
    consent_events: Mapped[List['ConsentEvent']] = db.relationship(
        'ConsentEvent', back_populates='booking', lazy='dynamic', cascade='all, delete-orphan'
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'public_id': str(self.public_id),
            'booking_number': self.booking_number,
            'booking_date': self.created_at.date().isoformat(),
            'booking_time': self.created_at.time().isoformat(),
            'status': self.status.value,
            'buyer_last_name': self.buyer_last_name,
            'buyer_first_name': self.buyer_first_name,
            'email_address': self.email_address,
            'phone_number': self.phone_number,
            'currency': self.currency.value,
            'fare_price': self.fare_price,
            'total_discounts': self.total_discounts,
            'fees': self.fees,
            'total_price': self.total_price,
            'user_id': self.user_id,
            'expires_at': (
                self.booking_hold.expires_at.isoformat()
                if self.booking_hold and self.booking_hold.expires_at
                else None
            ),
        }

    PNR_MASK = 'ABXXXX'

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['booking_number'], descending=False)

    @classmethod
    def get_by_public_id(cls, public_id):
        return cls.query.filter_by(public_id=UUID_cls(str(public_id))).first_or_404()

    @classmethod
    def get_if_has_access(
        cls, current_user, public_id, access_token=None
    ):
        """Return booking if the user or token grants access, otherwise None"""
        booking = cls.get_by_public_id(public_id)

        token = str(access_token) if access_token else None
        booking_token = str(booking.access_token)

        if current_user:
            if current_user.role == USER_ROLE.admin:
                return booking
            if booking.user_id:
                if booking.user_id == current_user.id:
                    return booking
                else:
                    return None

        if token:
            if booking_token == token:
                return booking

        return None

    @classmethod
    def generate_booking_number(
        cls,
        id,
        session: Session,
        *,
        commit: bool = False,
    ):
        """Generates a unique booking number (PNR - Passenger Name Record)"""
        existing_booking_numbers = {
            booking.booking_number for booking in session.query(cls).all()
        }
        booking_number = None
        while True:
            booking_number = ''.join(
                (
                    random.choice(string.ascii_uppercase + string.digits)
                    if ch == 'X'
                    else ch
                )
                for ch in cls.PNR_MASK
            )
            if booking_number not in existing_booking_numbers:
                break

        return cls.update(
            id, session=session, commit=commit, booking_number=booking_number
        )

    @classmethod
    def save_snapshot(
        cls,
        id,
        session: Session | None = None,
        *,
        commit: bool = False,
    ):
        """Generates and saves a reusable booking snapshot"""
        session = session or db.session
        booking = cls.get_or_404(id, session)

        from app.models.booking_passenger import BookingPassenger

        booking_passengers = session.query(BookingPassenger).filter(BookingPassenger.booking_id == booking.id).all()

        for bp in booking_passengers:
            bp.passenger_snapshot = build_booking_passenger_snapshot(bp)

        snapshot = build_booking_snapshot(booking)

        return cls.update(
            id, session=session, commit=commit, details_snapshot=snapshot
        )

    @classmethod
    def create_booking_flight_passengers(
        cls,
        booking_id: int,
        session: Session | None = None,
        *,
        commit: bool = False,
    ):
        """Create BookingFlightPassenger rows for every passenger/flight pair"""
        session = session or db.session
        booking = cls.get_or_404(booking_id, session)

        from app.models.booking_passenger import BookingPassenger
        from app.models.booking_flight import BookingFlight
        from app.models.flight_tariff import FlightTariff
        from app.models.booking_flight_passenger import BookingFlightPassenger

        booking_passengers = (
            session.query(BookingPassenger)
            .filter(BookingPassenger.booking_id == booking.id)
            .all()
        )
        if not booking_passengers:
            return []

        booking_passenger_ids = [bp.id for bp in booking_passengers]

        flight_rows = (
            session.query(FlightTariff.flight_id)
            .join(BookingFlight, BookingFlight.flight_tariff_id == FlightTariff.id)
            .filter(BookingFlight.booking_id == booking.id)
            .all()
        )
        flight_ids = {
            row.flight_id for row in flight_rows if row.flight_id is not None
        }
        if not flight_ids:
            return []

        existing_pairs = set(
            session.query(
                BookingFlightPassenger.booking_passenger_id,
                BookingFlightPassenger.flight_id,
            )
            .filter(BookingFlightPassenger.booking_passenger_id.in_(booking_passenger_ids))
            .filter(BookingFlightPassenger.flight_id.in_(flight_ids))
            .all()
        )

        created = []
        for bp_id in booking_passenger_ids:
            for flight_id in flight_ids:
                if (bp_id, flight_id) in existing_pairs:
                    continue
                instance = BookingFlightPassenger.create(
                    session=session,
                    commit=False,
                    booking_passenger_id=bp_id,
                    flight_id=flight_id,
                )
                created.append(instance)
                existing_pairs.add((bp_id, flight_id))

        if commit:
            session.commit()

        return created

    @classmethod
    def create(
        cls,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session
        kwargs = cls.convert_enums(kwargs)

        status = kwargs.get('status', DEFAULT_BOOKING_STATUS)
        timestamp = datetime.now().isoformat()
        kwargs['status_history'] = [{'status': status.value, 'at': timestamp}]

        kwargs.setdefault('access_token', uuid.uuid4())

        return super().create(session, commit=commit, **kwargs)

    @classmethod
    def update(
        cls,
        booking_id,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session
        booking = cls.get_or_404(booking_id, session)
        kwargs = cls.convert_enums(kwargs)

        old_status = booking.status
        new_status = kwargs.get('status', old_status)
        timestamp = datetime.now().isoformat()

        if old_status != new_status:
            history = list(booking.status_history or [])
            history.append({'status': new_status.value, 'at': timestamp})
            kwargs['status_history'] = history

        return super().update(booking_id, session=session, commit=commit, **kwargs)

    @classmethod
    def update_by_public_id(
        cls,
        public_id,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session
        booking = cls.get_by_public_id(public_id)
        return cls.update(booking.id, session=session, commit=commit, **kwargs)

    ALLOWED_TRANSITIONS = {
        BOOKING_STATUS.created: {
            BOOKING_STATUS.passengers_added,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.passengers_added: {
            BOOKING_STATUS.confirmed,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.confirmed: {
            BOOKING_STATUS.payment_pending,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.payment_pending: {
            BOOKING_STATUS.payment_confirmed,
            BOOKING_STATUS.payment_failed,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.payment_failed: {
            BOOKING_STATUS.payment_pending,
            BOOKING_STATUS.cancelled,
            BOOKING_STATUS.expired,
        },
        BOOKING_STATUS.payment_confirmed: {
            BOOKING_STATUS.completed,
            BOOKING_STATUS.cancelled,
        },
        BOOKING_STATUS.completed: {
            BOOKING_STATUS.cancelled
        },
        BOOKING_STATUS.expired: set(),
        BOOKING_STATUS.cancelled: set(),
    }

    FINAL_STATUSES = {
        BOOKING_STATUS.completed,
        BOOKING_STATUS.expired,
        BOOKING_STATUS.cancelled
    }

    PAGE_FLOW = {
        BOOKING_STATUS.created: ['passengers'],
        BOOKING_STATUS.passengers_added: ['passengers', 'confirmation'],
        BOOKING_STATUS.confirmed: ['confirmation', 'payment'],
        BOOKING_STATUS.payment_pending: ['confirmation', 'payment'],
        BOOKING_STATUS.payment_confirmed: ['confirmation', 'payment'],
        BOOKING_STATUS.payment_failed: ['confirmation', 'payment'],
        BOOKING_STATUS.completed: ['completion'],
        BOOKING_STATUS.expired: [],
        BOOKING_STATUS.cancelled: ['completion'],
    }

    @classmethod
    def get_accessible_pages(cls, current_user, public_id, access_token=None):
        booking = cls.get_if_has_access(current_user, public_id, access_token)
        if not booking:
            return []
        return cls.PAGE_FLOW.get(booking.status, [])

    @classmethod
    def transition_status(
        cls,
        id,
        to_status,
        session: Session | None = None,
        *,
        commit: bool = False,
    ):
        session = session or db.session
        booking = cls.get_or_404(id)
        from_status = booking.status
        if (from_status != to_status and
            to_status not in cls.ALLOWED_TRANSITIONS.get(from_status, set())
        ):
            raise ValueError(
                BookingMessages.illegal_transition(from_status.value, to_status.value)
            )

        booking = cls.update(
            id,
            session=session,
            commit=commit,
            status=to_status,
        )

        if to_status == BOOKING_STATUS.completed:
            cls.save_snapshot(
                id,
                session=session,
                commit=commit,
            )

        return booking
