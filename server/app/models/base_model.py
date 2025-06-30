from database import db


class BaseModel(db.Model):
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    created_at = db.Column(db.DateTime, default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, default=db.func.now(),
                          onupdate=db.func.now(), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.String, nullable=True)
    updated_by = db.Column(db.String, nullable=True)

    @classmethod
    def get_all(cls):
        return cls.query.all()

    @classmethod
    def get_by_id(cls, _id):
        return cls.query.get(_id)

    @classmethod
    def delete(cls, _id):
        instance = cls.get_by_id(_id)
        if instance:
            db.session.delete(instance)
            db.session.commit()
            return instance
        return None
