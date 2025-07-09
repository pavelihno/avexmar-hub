from app.database import db
from app.models._base_model import BaseModel


class Seat(BaseModel):
    __tablename__ = 'seats'

    seat_number = db.Column(db.String(10), nullable=False)

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='SET NULL'), nullable=True)
    tariff_id = db.Column(db.Integer, db.ForeignKey('tariffs.id', ondelete='RESTRICT'), nullable=False)

    __table_args__ = (
        db.UniqueConstraint(
            'tariff_id', 'seat_number', 
            name='uix_tariff_seat_number'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'seat_number': self.seat_number,
            'booking_id': self.booking_id,
            'tariff_id': self.tariff_id,
            'is_booked': self.is_booked
        }
