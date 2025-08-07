from app.database import db
from app.models._base_model import BaseModel


class Fee(BaseModel):
    __tablename__ = 'fees'

    name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.String, nullable=True)
    amount = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'amount': self.amount,
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['name'], descending=False)
