import uuid

from database import db
from models.base_model import BaseModel


class Booking(BaseModel):
    __tablename__ = 'bookings'

    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id'), nullable=False)
    date = db.Column('flight_date', db.Date, nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    seat_class = db.Column(db.String(), nullable=False)
    booked_at = db.Column('booking_time', db.DateTime, default=db.func.current_timestamp())

    # Booking state
    booking_reference = db.Column(
        db.String(6),
        unique=True,
        index=True,
        nullable=False,
        default=lambda: uuid.uuid4().hex[:6].upper(),
    )
    is_confirmed = db.Column(db.Boolean, default=False, nullable=False)

    # Pricing
    base_price = db.Column(db.Float, nullable=False)
    tax_amount = db.Column(db.Float, nullable=False, default=0.0)
    discount_amount = db.Column(db.Float, nullable=False, default=0.0)
    final_price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="USD")

    # Payment tracking
    payment_status = db.Column(db.String, nullable=False, default="pending")
    payment_date = db.Column(db.DateTime, nullable=True)
    payment_method = db.Column(db.String, nullable=True)
    payment_reference = db.Column(db.String, nullable=True)

    __table_args__ = (
        db.CheckConstraint(seat_class.in_(['economy', 'business']), name='seat_class_types'),
        db.CheckConstraint(
            payment_status.in_(['pending', 'paid', 'refunded', 'failed']),
            name='payment_status_types',
        ),
    )

    flight = db.relationship('Flight', backref='bookings')
    passenger = db.relationship('Passenger', backref='bookings')

    def to_dict(self):
        return {
            'id': self.id,
            'flight_id': self.flight_id,
            'date': self.date,
            'passenger_id': self.passenger_id,
            'seat_class': self.seat_class,
            'booked_at': self.booked_at,
            'booking_reference': self.booking_reference,
            'is_confirmed': self.is_confirmed,
            'base_price': float(self.base_price) if self.base_price is not None else None,
            'tax_amount': float(self.tax_amount) if self.tax_amount is not None else None,
            'discount_amount': float(self.discount_amount) if self.discount_amount is not None else None,
            'final_price': float(self.final_price) if self.final_price is not None else None,
            'currency': self.currency,
            'payment_status': self.payment_status,
            'payment_date': self.payment_date,
            'payment_method': self.payment_method,
            'payment_reference': self.payment_reference,
        }

    @classmethod
    def create(cls, **data):
        booking = cls(**data)
        db.session.add(booking)
        db.session.commit()
        return booking

    @classmethod
    def update(cls, _id, **data):
        booking = cls.get_by_id(_id)
        if booking:
            for key, value in data.items():
                if hasattr(booking, key):
                    setattr(booking, key, value)
            db.session.commit()
            return booking
        return None
