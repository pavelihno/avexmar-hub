from app.database import db
from app.models._base_model import BaseModel

from app.config import Config

class Discount(BaseModel):
    __tablename__ = 'discounts'

    discount_name = db.Column(db.String, unique=True, nullable=False)
    discount_type = db.Column(db.Enum(Config.DISCOUNT_TYPE), nullable=False)
    percentage_value = db.Column(db.Float, nullable=False)

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