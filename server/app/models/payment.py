from app.database import db
from app.models._base_model import BaseModel
from app.config import Config


class Payment(BaseModel):
    __tablename__ = 'payments'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False)
    payment_method = db.Column(db.Enum(Config.PAYMENT_METHOD), nullable=False)
    payment_status = db.Column(db.Enum(Config.PAYMENT_STATUS), nullable=False, default=Config.DEFAULT_PAYMENT_STATUS)

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'payment_method': self.payment_method.value,
            'payment_status': self.payment_status.value
        }
