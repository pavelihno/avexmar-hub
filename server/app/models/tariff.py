from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.utils.enum import SEAT_CLASS, CURRENCY, DEFAULT_CURRENCY

if TYPE_CHECKING:
    from app.models.flight_tariff import FlightTariff
    from app.models.fee import Fee


class Tariff(BaseModel):
    __tablename__ = 'tariffs'

    seat_class = db.Column(db.Enum(SEAT_CLASS), nullable=False)
    order_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String, nullable=False)
    price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.Enum(CURRENCY), nullable=False, default=DEFAULT_CURRENCY)
    conditions = db.Column(db.String, nullable=True)
    baggage = db.Column(db.Integer, nullable=False)
    hand_luggage = db.Column(db.Integer, nullable=False)
    ticket_return_allowed = db.Column(db.Boolean, nullable=False, default=False)

    flight_tariffs: Mapped[List['FlightTariff']] = db.relationship(
        'FlightTariff', back_populates='tariff', lazy='dynamic', cascade='all, delete-orphan'
    )
    fees : Mapped[List['Fee']] = db.relationship('Fee', secondary='tariff_fees', back_populates='tariffs')

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'seat_class': self.seat_class.value,
            'order_number': self.order_number,
            'title': self.title,
            'currency': self.currency.value,
            'price': self.price,
            'conditions': self.conditions,
            'baggage': self.baggage,
            'hand_luggage': self.hand_luggage,
            'ticket_return_allowed': self.ticket_return_allowed,
            'fee_ids': [f.id for f in self.fees] if self.fees else []
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['seat_class', 'order_number'], descending=False)

    @classmethod
    def create(
        cls,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session
        seat_class = kwargs.get('seat_class')

        if seat_class is not None:
            query = session.query(cls).filter(cls.seat_class == seat_class)
            max_order = query.order_by(cls.order_number.desc()).first()
            next_order = (max_order.order_number + 1) if max_order else 1
            kwargs['order_number'] = next_order

        return super().create(session, commit=commit, **kwargs)
