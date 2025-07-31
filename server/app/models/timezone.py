from app.database import db
from app.models._base_model import BaseModel


class Timezone(BaseModel):
    __tablename__ = 'timezones'

    name = db.Column(db.String, nullable=False, unique=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
        }
