from typing import Optional

from sqlalchemy import inspect

from app.database import db


class BaseModel(db.Model):
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    created_at = db.Column(db.DateTime, default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now(), nullable=False)

    def __filter_out_non_existing_fields(self, kwargs) -> dict:
        """Filter out fields that do not exist in the model"""
        mapper = inspect(self.__class__)
        valid = set(mapper.attrs.keys())
        return {k: v for k, v in kwargs.items() if k in valid}
    
    def __init__(self, **kwargs) -> None:
        filtered_kwargs = self.__filter_out_non_existing_fields(kwargs)
        super().__init__(**filtered_kwargs)

    @classmethod
    def get_all(cls) -> list['BaseModel']:
        return cls.query.all()

    @classmethod
    def get_by_id(cls, _id) -> Optional['BaseModel']:
        return cls.query.get(_id)

    @classmethod
    def create(cls, **data) -> Optional['BaseModel']:
        instance = cls(**data)
        db.session.add(instance)
        db.session.commit()
        return instance

    @classmethod
    def update(cls, _id, **data) -> Optional['BaseModel']:
        instance = cls.get_by_id(_id)
        if not instance:
            return None

        filtered_data = instance.__filter_out_non_existing_fields(data)
        for key, value in filtered_data.items():
            setattr(instance, key, value)

        db.session.commit()
        return instance

    @classmethod
    def delete(cls, _id) -> Optional['BaseModel']:
        instance = cls.get_by_id(_id)
        if instance:
            db.session.delete(instance)
            db.session.commit()
            return instance
        return None
