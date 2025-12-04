from app.database import db
from app.models._base_model import BaseModel
from app.constants.models import ModelVerboseNames

from app.utils.enum import DISCOUNT_TYPE


class Discount(BaseModel):
    __tablename__ = 'discounts'
    __verbose_name__ = ModelVerboseNames.Discount

    discount_name = db.Column(db.String, unique=True, nullable=False)
    discount_type = db.Column(db.Enum(DISCOUNT_TYPE), nullable=False)
    percentage_value = db.Column(db.Float, nullable=False)

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'discount_name': self.discount_name,
            'discount_type': self.discount_type.value,
            'percentage_value': self.percentage_value
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['discount_name'], descending=False)
