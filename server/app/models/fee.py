from app.config import Config
from app.database import db
from app.models._base_model import BaseModel


class Fee(BaseModel):
    __tablename__ = 'fees'

    name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.String, nullable=True)
    amount = db.Column(db.Float, nullable=False)
    application = db.Column(db.Enum(Config.FEE_APPLICATION), nullable=False)
    application_term = db.Column(
        db.Enum(Config.FEE_TERM), nullable=False, default=Config.FEE_TERM.none
    )

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'amount': self.amount,
            'application': self.application.value,
            'application_term': self.application_term.value,
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['name'], descending=False)

    @classmethod
    def get_applicable(cls, application, hours_before_departure=None):
        query = cls.query.filter_by(application=application)
        if application == Config.FEE_APPLICATION.booking:
            query = query.filter_by(application_term=Config.FEE_TERM.none)
        else:
            if hours_before_departure is None:
                term = Config.FEE_TERM.after_departure
            elif hours_before_departure > 24:
                term = Config.FEE_TERM.before_24h
            elif hours_before_departure >= 0:
                term = Config.FEE_TERM.within_24h
            else:
                term = Config.FEE_TERM.after_departure
            query = query.filter_by(application_term=term)
        return query.all()

    @classmethod
    def calculate_fees(
        cls, passengers_count, application, hours_before_departure=None
    ):
        fees = cls.get_applicable(application, hours_before_departure)
        result = []
        total = 0.0
        for fee in fees:
            fee_total = fee.amount * passengers_count
            result.append({'name': fee.name, 'amount': fee.amount, 'total': fee_total})
            total += fee_total
        return result, total
