from app.utils.enum import FEE_APPLICATION, FEE_TERM, DEFAULT_FEE_APPLICATION, DEFAULT_FEE_TERM
from app.database import db
from app.models._base_model import BaseModel


class Fee(BaseModel):
    __tablename__ = 'fees'

    name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.String, nullable=True)
    amount = db.Column(db.Float, nullable=False)
    application = db.Column(db.Enum(FEE_APPLICATION), nullable=False, default=DEFAULT_FEE_APPLICATION)
    application_term = db.Column(db.Enum(FEE_TERM), nullable=False, default=DEFAULT_FEE_TERM)

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
    def get_applicable_fees(cls, application, hours_before_departure=None):
        query = cls.query.filter_by(application=application)
        if application == FEE_APPLICATION.booking:
            query = query.filter_by(application_term=FEE_TERM.none)
        else:
            if hours_before_departure is None:
                term = FEE_TERM.after_departure
            elif hours_before_departure > 24:
                term = FEE_TERM.before_24h
            elif hours_before_departure >= 0:
                term = FEE_TERM.within_24h
            else:
                term = FEE_TERM.after_departure
            query = query.filter_by(application_term=term)
        return query.all()
