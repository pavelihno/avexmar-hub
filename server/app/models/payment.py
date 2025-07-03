from app.database import db
from app.models._base_model import BaseModel
from app.config import Config


class Payment(BaseModel):
    __tablename__ = 'payments'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False)
    payment_method = db.Column(db.String, nullable=False)
    payment_status = db.Column(db.String, nullable=False, default=Config.DEFAULT_PAYMENT_STATUS)

    __table_args__ = (
        db.CheckConstraint(payment_status.in_(Config.ENUM_PAYMENT_STATUS), name='payment_status_types'),
        db.CheckConstraint(payment_method.in_(Config.ENUM_PAYMENT_METHOD), name='payment_method_types'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status
        }
