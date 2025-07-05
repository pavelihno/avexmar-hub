from app.database import db
from app.models._base_model import BaseModel
from app.config import Config


class Passenger(BaseModel):
    __tablename__ = 'passengers'

    full_name = db.Column(db.String(), nullable=False)
    document_number = db.Column(db.String(), unique=True, nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(), nullable=False)
    is_infant = db.Column(db.Boolean, default=False, nullable=False)

    __table_args__ = (
        db.CheckConstraint(gender.in_(Config.ENUM_GENDER), name='passenger_gender_types'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'birth_date': self.birth_date,
            'gender': self.gender,
            'document_number': self.document_number,
            'is_infant': self.is_infant
        }
