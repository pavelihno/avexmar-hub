from database import db


class BaseModel(db.Model):
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    created_at = db.Column(db.DateTime, default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now(), nullable=False)

    @classmethod
    def get_all(cls):
        return cls.query.all()

    @classmethod
    def get_by_id(cls, _id):
        return cls.query.get(_id)

    @classmethod
    def create(cls, **data):
        instance = cls(**data)
        db.session.add(instance)
        db.session.commit()
        return instance

    @classmethod
    def update(cls, _id, **data):
        instance = cls.get_by_id(_id)
        if instance:
            for key, value in data.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
            db.session.commit()
            return instance
        return None

    @classmethod
    def delete(cls, _id):
        instance = cls.get_by_id(_id)
        if instance:
            db.session.delete(instance)
            db.session.commit()
            return instance
        return None
