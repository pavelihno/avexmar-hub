from sqlalchemy.orm import Session

from app.database import db
from app.models._base_model import BaseModel
from app.config import Config


class Tariff(BaseModel):
    __tablename__ = 'tariffs'

    seat_class = db.Column(db.Enum(Config.SEAT_CLASS), nullable=False)
    order_number = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.Enum(Config.CURRENCY), nullable=False, default=Config.DEFAULT_CURRENCY)
    conditions = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'seat_class': self.seat_class.value,
            'order_number': self.order_number,
            'currency': self.currency.value,
            'price': self.price,
            'conditions': self.conditions
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='seat_class', descending=False)

    @classmethod
    def create(cls, session: Session | None = None, **data):
        session = session or db.session
        seat_class = data.get('seat_class')

        if seat_class is not None:
            query = session.query(cls).filter_by(seat_class=seat_class)
            max_order = query.order_by(cls.order_number.desc()).first()
            next_order = (max_order.order_number + 1) if max_order else 1
            data['order_number'] = next_order

        return super().create(session, **data)
