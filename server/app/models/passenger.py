import datetime

from app.database import db
from app.models._base_model import BaseModel
from app.config import Config


class Passenger(BaseModel):
    __tablename__ = 'passengers'

    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)

    document_type = db.Column(db.Enum(Config.DOCUMENT_TYPE), nullable=False)
    document_number = db.Column(db.String, unique=True, nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    gender = db.Column(db.Enum(Config.GENDER), nullable=False)

    __table_args__ = (
        db.UniqueConstraint(
            'document_number', 'document_type',
            name='uix_document_number_type'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'document_type': self.document_type.value,
            'document_number': self.document_number,
            'birth_date': self.birth_date.isoformat()
        }

    def is_infant(self, date=datetime.date.today()):
        """Check if the passenger is an infant (under 1 year old)"""
        years = date.year - self.birth_date.year - ((date.month, date.day) < (self.birth_date.month, self.birth_date.day))
        return years < 1

    def is_child(self, date=datetime.date.today()):
        """Check if the passenger is a child (between 1 and 3 years old)"""
        years = date.year - self.birth_date.year - ((date.month, date.day) < (self.birth_date.month, self.birth_date.day))
        return 1 <= years < 3
