from database import db


class BaseModel(db.Model):
    __abstract__ = True

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
