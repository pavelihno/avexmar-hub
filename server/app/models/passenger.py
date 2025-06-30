from database import db
from models.base_model import BaseModel

class Passenger(BaseModel):
    __tablename__ = 'passengers'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column('full_name', db.String(), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(), nullable=False)
    document_id = db.Column('id_document', db.String(), unique=True, nullable=False)
