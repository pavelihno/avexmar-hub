from database import db
from models.base_model import BaseModel
from config import Config


class Payment(BaseModel):
    __tablename__ = 'payments'

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    payment_method = db.Column(db.String, nullable=False)
    payment_status = db.Column(db.String, nullable=False, default=Config.DEFAULT_PAYMENT_STATUS)
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    booking = db.relationship('Booking', backref='payments')

    __table_args__ = (
        db.CheckConstraint(payment_status.in_(Config.ENUM_PAYMENT_STATUS), name='payment_status_types'),
        db.CheckConstraint(payment_method.in_(Config.ENUM_PAYMENT_METHOD), name='payment_method_types'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'updated_at': self.updated_at
        }
