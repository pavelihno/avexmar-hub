from typing import TYPE_CHECKING

from app.database import db
from app.models._base_model import BaseModel

if TYPE_CHECKING:
    from app.models.tariff import Tariff
    from app.models.fee import Fee


class TariffFee(BaseModel):
    __tablename__ = 'tariff_fees'

    tariff_id = db.Column(db.Integer, db.ForeignKey(
        'tariffs.id', ondelete='CASCADE'), nullable=False
    )
    fee_id = db.Column(db.Integer, db.ForeignKey(
        'fees.id', ondelete='CASCADE'), nullable=False
    )

    __table_args__ = (
        db.UniqueConstraint('tariff_id', 'fee_id', name='uix_tariff_fee'),
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'tariff_id': self.tariff_id,
            'fee_id': self.fee_id,
        }
