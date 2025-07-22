from app.database import db
from app.models._base_model import BaseModel


class BookingPassenger(BaseModel):
    __tablename__ = 'booking_passengers'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    is_contact = db.Column(db.Boolean, default=False, nullable=False)

    __table_args__ = (
        db.UniqueConstraint(
            'booking_id', 'passenger_id',
            name='uix_booking_passenger_unique'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'passenger_id': self.passenger_id,
            'is_contact': self.is_contact
        }
