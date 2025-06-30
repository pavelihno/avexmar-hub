from datetime import datetime

from database import db
from models.base_model import BaseModel


class Flight(BaseModel):
    __tablename__ = 'flights'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    number = db.Column('flight_number', db.String(), nullable=False)
    origin_airport = db.Column('origin', db.String(), nullable=False)
    destination_airport = db.Column('destination', db.String(), nullable=False)
    scheduled_departure = db.Column('departure_time', db.DateTime)
    scheduled_arrival = db.Column('arrival_time', db.DateTime)
