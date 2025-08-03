from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel

from app.config import Config

if TYPE_CHECKING:
    from app.models.ticket import Ticket

class Discount(BaseModel):
    __tablename__ = 'discounts'

    discount_name = db.Column(db.String, unique=True, nullable=False)
    discount_type = db.Column(db.Enum(Config.DISCOUNT_TYPE), nullable=False)
    percentage_value = db.Column(db.Float, nullable=False)

    tickets: Mapped[List['Ticket']] = db.relationship('Ticket', back_populates='discount', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'discount_name': self.discount_name,
            'discount_type': self.discount_type.value,
            'percentage_value': self.percentage_value
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='discount_name', descending=False)
