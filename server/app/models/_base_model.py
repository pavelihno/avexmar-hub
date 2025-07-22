from typing import Optional, List, Dict

from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import db


class ModelValidationError(Exception):
    """Exception raised for model validation errors"""

    def __init__(self, errors: Dict[str, str]):
        self.errors = errors
        message = '; '.join(f'{k}: {v}' for k, v in errors.items())
        super().__init__(message)


class NotFoundError(Exception):
    """Exception raised when a requested object was not found"""

    def __init__(self, message: str) -> None:
        super().__init__(message)


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
    def get_all(cls, sort_by: str = None, descending: bool = False) -> List['BaseModel']:
        query = cls.query
        if sort_by:
            column = getattr(cls, sort_by, None)
            if column is not None:
                query = query.order_by(column.desc() if descending else column.asc())
        return query.all()

    @classmethod
    def get_by_id(cls, _id) -> Optional['BaseModel']:
        return cls.query.get(_id)

    @classmethod
    def _unique_constraints(cls) -> List[List[str]]:
        """Return list of unique constraint column name lists"""
        uniques: List[List[str]] = []
        for column in cls.__table__.columns:
            if column.unique:
                uniques.append([column.name])
        for constraint in cls.__table__.constraints:
            if isinstance(constraint, db.UniqueConstraint):
                uniques.append([c.name for c in constraint.columns])
        return uniques

    @classmethod
    def _check_unique(
        cls, session: Session, data: dict, instance_id: Optional[int] = None
    ) -> Dict[str, str]:
        errors: Dict[str, str] = {}
        for columns in cls._unique_constraints():
            if not all(col in data for col in columns):
                continue
            query = session.query(cls)
            for col in columns:
                query = query.filter(getattr(cls, col) == data[col])
            if instance_id is not None:
                query = query.filter(cls.id != instance_id)
            if query.first() is not None:
                for col in columns:
                    errors[col] = 'must be unique'
        return errors

    @classmethod
    def _check_foreign_keys_exist(cls, session: Session, data: dict) -> None:
        """Ensure that all provided foreign keys reference existing rows."""
        for column in cls.__table__.columns:
            if column.foreign_keys and column.name in data:
                value = data[column.name]
                if value is None:
                    continue
                fk = next(iter(column.foreign_keys))
                target_table = fk.column.table
                target_cls = next(
                    (
                        c
                        for c in db.Model._decl_class_registry.values()
                        if hasattr(c, "__tablename__") and c.__tablename__ == target_table.name
                    ),
                    None,
                )
                if target_cls is not None and session.get(target_cls, value) is None:
                    raise NotFoundError(f"{target_cls.__name__} not found")

    @classmethod
    def get_or_404(cls, _id, session: Session | None = None) -> "BaseModel":
        session = session or db.session
        instance = cls.get_by_id(_id)
        if not instance:
            raise NotFoundError(f"{cls.__name__} not found")
        return instance

    @classmethod
    def delete_or_404(cls, _id, session: Session | None = None) -> "BaseModel":
        session = session or db.session
        instance = cls.get_or_404(_id, session)
        try:
            session.delete(instance)
            session.commit()
            return instance
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({"message": str(e)}) from e

    @classmethod
    def create(cls, session: Session | None = None, **data) -> Optional['BaseModel']:
        session = session or db.session
        instance = cls(**data)
        filtered_data = instance._BaseModel__filter_out_non_existing_fields(data)
        cls._check_foreign_keys_exist(session, filtered_data)
        errors = cls._check_unique(session, filtered_data)
        if errors:
            raise ModelValidationError(errors)

        session.add(instance)
        try:
            session.commit()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'message': str(e)}) from e
        return instance

    @classmethod
    def update(
        cls, _id, session: Session | None = None, **data
    ) -> Optional['BaseModel']:
        session = session or db.session
        instance = cls.get_by_id(_id)
        if not instance:
            raise NotFoundError(f"{cls.__name__} not found")

        filtered_data = instance._BaseModel__filter_out_non_existing_fields(data)
        cls._check_foreign_keys_exist(session, filtered_data)
        errors = cls._check_unique(session, filtered_data, instance.id)
        for key, value in filtered_data.items():
            setattr(instance, key, value)
        if errors:
            session.rollback()
            raise ModelValidationError(errors)

        try:
            session.commit()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'message': str(e)}) from e
        return instance

    @classmethod
    def delete(
        cls, _id, session: Session | None = None
    ) -> Optional['BaseModel']:
        session = session or db.session
        instance = cls.get_by_id(_id)
        if not instance:
            raise NotFoundError(f"{cls.__name__} not found")
        try:
            session.delete(instance)
            session.commit()
            return instance
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'message': str(e)}) from e

    @classmethod
    def delete_all(cls, session: Session | None = None) -> int:
        session = session or db.session
        try:
            count = session.query(cls).delete()
            session.commit()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'message': str(e)}) from e
        return count
