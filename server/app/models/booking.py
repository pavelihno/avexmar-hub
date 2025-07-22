import random
import string

from app.database import db
from app.models._base_model import BaseModel
from app.config import Config


class Booking(BaseModel):
    __tablename__ = 'bookings'

    # Booking details
    booking_number = db.Column(db.String, unique=True, nullable=False)
    status = db.Column(db.Enum(Config.BOOKING_STATUS), nullable=False, default=Config.DEFAULT_BOOKING_STATUS)

    # Customer details
    email_address = db.Column(db.String, nullable=False)
    phone_number = db.Column(db.String, nullable=False)

    # Price details
    currency = db.Column(db.Enum(Config.CURRENCY), nullable=False, default=Config.DEFAULT_CURRENCY)
    base_price = db.Column(db.Float, nullable=False)
    final_price = db.Column(db.Float, nullable=False)

    # Relationships
    payments = db.relationship('Payment', backref=db.backref('booking', lazy=True), lazy='dynamic', cascade='all, delete-orphan')
    tickets = db.relationship('Ticket', backref=db.backref('booking', lazy=True), lazy='dynamic', cascade='all, delete-orphan')
    seats = db.relationship('Seat', backref=db.backref('booking', lazy=True),lazy='dynamic', cascade='save-update, merge')

    def to_dict(self):
        return {
            'id': self.id,
            'booking_number': self.booking_number,
            'status': self.status.value,
            'email_address': self.email_address,
            'phone_number': self.phone_number,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'currency': self.currency.value,
            'base_price': self.base_price,
            'final_price': self.final_price
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='booking_number', descending=False)

    @classmethod
    def __generate_booking_number(cls):
        """Generates a unique booking number (PNR - Passenger Name Record)"""
        existing_booking_numbers = {
            booking.booking_number for booking in cls.query.all()}

        while True:
            booking_number = ''.join(
                random.choice(string.ascii_uppercase + string.digits)
                if ch == 'X' else ch
                for ch in Config.PNR_MASK
            )
            if booking_number not in existing_booking_numbers:
                return booking_number

    @classmethod
    def create(cls, **kwargs):
        kwargs['booking_number'] = cls.__generate_booking_number()
        return super().create(**kwargs)