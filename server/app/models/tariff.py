from app.database import db
from app.models._base_model import BaseModel
from app.config import Config


tariff_discount = db.Table('tariff_discount',
    db.Column('tariff_id', db.Integer, db.ForeignKey('tariffs.id', ondelete='CASCADE'), primary_key=True),
    db.Column('discount_id', db.Integer, db.ForeignKey('discounts.id', ondelete='CASCADE'), primary_key=True)
)

class Tariff(BaseModel):
    __tablename__ = 'tariffs'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), nullable=False)
    seat_class = db.Column(db.Enum(Config.SEAT_CLASS), nullable=False)
    seats_number = db.Column(db.Integer, nullable=False)

    currency = db.Column(db.Enum(Config.CURRENCY), nullable=False, default=Config.DEFAULT_CURRENCY)
    price = db.Column(db.Float, nullable=False)

    seats = db.relationship('Seat', backref=db.backref('tariff', lazy=True), lazy='dynamic', cascade='all, delete-orphan')
    discounts = db.relationship('Discount', secondary=tariff_discount, backref=db.backref('tariffs', lazy=True), lazy='dynamic', cascade='all, delete')

    def to_dict(self):
        return {
            'id': self.id,
            'flight_id': self.flight_id,
            'seat_class': self.seat_class.value,
            'seats_number': self.seats_number,
            'currency': self.currency.value,
            'price': self.price
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='seat_class', descending=False)
