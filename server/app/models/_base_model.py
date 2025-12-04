from typing import Optional, List, Dict, Callable, Any, Iterable, Tuple
from collections.abc import Iterable as IterableABC

from sqlalchemy import inspect, Enum as SAEnum
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.constants.messages import ModelMessages
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

    @classmethod
    def __prepare_for_save(cls, data: dict) -> dict:
        """Normalise payload values before persisting"""
        if not data:
            return data

        mapper = inspect(cls)
        nullable_columns = {
            column.key for column in mapper.columns if column.nullable
        }

        cleaned = {}
        for k, v in data.items():
            if k in nullable_columns and isinstance(v, str) and v.strip() == '':
                cleaned[k] = None
                continue
            cleaned[k] = v
        return cleaned

    @classmethod
    def convert_enums(cls, data: dict) -> dict:
        """Convert enum field values to enum instances, set None if invalid"""
        mapper = inspect(cls)
        for column in mapper.columns:
            if isinstance(column.type, SAEnum):
                enum_cls = column.type.enum_class
                key = column.name
                if key in data:
                    value = data[key]
                    if value is None:
                        continue
                    if not isinstance(value, enum_cls):
                        try:
                            data[key] = enum_cls(
                                getattr(value, 'value', value)
                            )
                        except Exception:
                            data[key] = None
        return data

    def __init__(self, **kwargs) -> None:
        kwargs = self.__filter_out_non_existing_fields(kwargs)
        kwargs = type(self).convert_enums(kwargs)
        super().__init__(**kwargs)

    @classmethod
    def get_upload_xlsx_template(cls):
        from app.constants.messages import XlsxMessages
        raise NotImplementedError(
            XlsxMessages.template_not_supported(cls.__name__))

    @classmethod
    def upload_from_file(
        cls,
        file,
        session: Session | None = None,
    ):
        from app.constants.messages import XlsxMessages
        raise NotImplementedError(
            XlsxMessages.upload_not_supported(cls.__name__)
        )

    @classmethod
    def _process_upload_rows(
        cls,
        rows: Iterable[Dict[str, Any]],
        row_processor: Callable[[Dict[str, Any], Session], Optional[Any]],
        *,
        session: Session | None = None,
    ) -> Tuple[List[Any], List[Dict[str, Any]]]:
        """Run row processing for bulk uploads within a shared transaction"""
        session = session or db.session
        processed: List[Any] = []
        error_rows: List[Dict[str, Any]] = []

        for row in rows:
            if row.get('error'):
                error_rows.append(row)
                continue

            try:
                result = row_processor(row, session)
                if result is not None:
                    processed.append(result)
            except Exception as exc:
                row['error'] = str(exc)
                error_rows.append(row)

        return processed, error_rows

    @classmethod
    def get_all(cls, sort_by: list = [], descending: bool = False) -> List['BaseModel']:
        query = cls.query

        if sort_by:
            mapper = inspect(cls)
            valid_attrs = {
                col.key: getattr(cls, col.key)
                for col in mapper.columns
            }

            order_cols = []
            for field in sort_by:
                col = valid_attrs.get(field)
                if col is not None:
                    order_cols.append(col.desc() if descending else col.asc())

            if order_cols:
                query = query.order_by(*order_cols)

        return query.all()

    @classmethod
    def get_by_id(cls, _id) -> Optional['BaseModel']:
        return cls.query.get(_id)

    @classmethod
    def __unique_constraints(cls) -> List[List[str]]:
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
    def __check_unique(
        cls, session: Session, data: dict, instance_id: Optional[int] = None
    ) -> Dict[str, str]:
        """Check if the provided data violates unique constraints.
        NOTE: SQL UNIQUE constraints allow multiple NULLs. We therefore skip
        validation for any (composite) unique set where at least one value is None.
        """
        errors: Dict[str, str] = {}
        for columns in cls.__unique_constraints():
            if not all(col in data for col in columns):
                continue
            if any(data[col] is None for col in columns):
                continue
            query = session.query(cls)
            for col in columns:
                query = query.filter(getattr(cls, col) == data[col])
            if instance_id is not None:
                query = query.filter(cls.id != instance_id)
            if query.one_or_none() is not None:
                for col in columns:
                    errors[col] = ModelMessages.MUST_BE_UNIQUE
        return errors

    @classmethod
    def __check_foreign_keys_exist(cls, session: Session, data: dict) -> None:
        """Ensure that all provided foreign keys reference existing rows"""
        for column in cls.__table__.columns:
            if column.foreign_keys and column.name in data:
                value = data[column.name]
                if value is None:
                    continue
                fk = next(iter(column.foreign_keys))
                target_table = fk.column.table
                target_cls = next(
                    (
                        mapper.class_
                        for mapper in db.Model.registry.mappers
                        if hasattr(mapper.class_, "__tablename__") and mapper.class_.__tablename__ == target_table.name
                    ),
                    None,
                )
                if target_cls is not None and session.get(target_cls, value) is None:
                    raise NotFoundError(
                        ModelMessages.not_found(verbose_name)
                    )

    @classmethod
    def __check_children_exist(
        cls,
        session: Session,
        instance_id: int,
    ) -> None:
        """Ensure that no child rows reference the given instance ID"""
        mapper = inspect(cls)

        pk_col = mapper.primary_key[0]

        linked_model_names = []

        for rel in mapper.relationships:
            if rel.direction.name not in ('ONETOMANY', 'ONETOONE'):
                continue

            if 'delete-orphan' in rel.cascade:
                continue

            child_cls = rel.mapper.class_

            query = (
                session.query(child_cls)
                .join(getattr(cls, rel.key))   # join child -> parent
                .filter(pk_col == instance_id)
            )

            if query.first() is not None:
                verbose_name = getattr(child_cls, '__verbose_name__', child_cls.__name__)
                linked_model_names.append(verbose_name)
        
        if linked_model_names:
            raise ModelValidationError({
                'message': ModelMessages.children_exist(linked_model_names)
            })

    @classmethod
    def get_or_404(cls, _id, session: Session | None = None) -> Optional['BaseModel']:
        session = session or db.session
        instance = cls.get_by_id(_id)
        if not instance:
            raise NotFoundError(ModelMessages.not_found(cls.__name__))
        return instance

    @classmethod
    def delete_or_404(
        cls,
        _id,
        session: Session | None = None,
        *,
        commit: bool = False,
    ) -> Optional[Dict]:
        session = session or db.session
        instance = cls.get_or_404(_id, session)

        # Uncomment to prevent exception related to foreign key violations
        # cls.__check_children_exist(session, _id)

        instance_dict = instance.to_dict() if hasattr(instance, 'to_dict') else None

        try:
            session.delete(instance)
            if commit:
                session.commit()
            else:
                session.flush()
            return instance_dict
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'message': str(e)}) from e

    @classmethod
    def create(
        cls,
        session: Session | None = None,
        *,
        commit: bool = False,
        **data,
    ) -> Optional['BaseModel']:
        session = session or db.session
        data.pop('id', None)
        data = cls.convert_enums(data)
        data = cls.__prepare_for_save(data)
        instance = cls(**data)
        filtered_data = instance.__filter_out_non_existing_fields(data)
        cls.__check_foreign_keys_exist(session, filtered_data)
        errors = cls.__check_unique(session, filtered_data)
        if errors:
            raise ModelValidationError(errors)

        session.add(instance)
        try:
            if commit:
                session.commit()
            else:
                session.flush()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'message': str(e)}) from e
        return instance

    @classmethod
    def update(
        cls,
        _id,
        session: Session | None = None,
        *,
        commit: bool = False,
        **data,
    ) -> Optional['BaseModel']:
        session = session or db.session
        instance = cls.get_or_404(_id, session)

        filtered_data = instance.__filter_out_non_existing_fields(data)
        filtered_data = cls.__prepare_for_save(filtered_data)
        filtered_data = cls.convert_enums(filtered_data)
        cls.__check_foreign_keys_exist(session, filtered_data)
        errors = cls.__check_unique(session, filtered_data, instance.id)
        for key, value in filtered_data.items():
            setattr(instance, key, value)
        if errors:
            session.rollback()
            raise ModelValidationError(errors)

        try:
            if commit:
                session.commit()
            else:
                session.flush()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'message': str(e)}) from e
        return instance

    @classmethod
    def delete(
        cls,
        _id,
        session: Session | None = None,
        *,
        commit: bool = False,
    ) -> Optional[Dict]:
        session = session or db.session
        return cls.delete_or_404(_id, session, commit=commit)

    @classmethod
    def delete_all(
        cls,
        session: Session | None = None,
        *,
        commit: bool = False,
    ) -> int:
        session = session or db.session
        try:
            count = session.query(cls).delete()
            if commit:
                session.commit()
            else:
                session.flush()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'message': str(e)}) from e
        return count

    @classmethod
    def delete_many(
        cls,
        ids: Iterable[int] | None,
        session: Session | None = None,
        *,
        commit: bool = False,
    ) -> int:
        session = session or db.session
        if not isinstance(ids, IterableABC) or isinstance(ids, (str, bytes)):
            raise ModelValidationError(
                {'message': ModelMessages.LIST_OF_IDS_REQUIRED}
            )
        try:
            cleaned_ids = {int(_id) for _id in ids if _id is not None}
        except (TypeError, ValueError):
            raise ModelValidationError(
                {'message': ModelMessages.IDS_MUST_BE_INTEGERS}
            )
        if not cleaned_ids:
            raise ModelValidationError(
                {'message': ModelMessages.LIST_OF_IDS_REQUIRED}
            )
        try:
            count = (
                session.query(cls)
                .filter(cls.id.in_(list(cleaned_ids)))
                .delete(synchronize_session=False)
            )
            if commit:
                session.commit()
            else:
                session.flush()
        except IntegrityError as e:
            session.rollback()
            raise ModelValidationError({'message': str(e)}) from e
        return count

    def to_dict(self, return_children: bool = False) -> Dict[str, Optional[str]]:
        return {
            'id': self.id,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }
