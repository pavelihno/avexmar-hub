from sqlalchemy.orm import Session

from app.database import db
from app.models._base_model import BaseModel
from app.utils.xlsx import parse_xlsx, generate_xlsx_template


class Timezone(BaseModel):
    __tablename__ = 'timezones'

    name = db.Column(db.String, nullable=False, unique=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
        }

    upload_fields = {
        'name': 'Часовой пояс',
    }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by='name', descending=False)

    @classmethod
    def get_xlsx_template(cls):
        return generate_xlsx_template(cls.upload_fields)

    @classmethod
    def upload_from_file(cls, file, session: Session | None = None):
        session = session or db.session
        rows = parse_xlsx(
            file,
            cls.upload_fields,
            required_fields=['name'],
        )

        timezones = []
        error_rows = []

        for row in rows:
            if not row.get('error'):
                try:
                    tz = cls.create(session, **row)
                    timezones.append(tz)
                except Exception as e:
                    row['error'] = str(e)

            if row.get('error'):
                error_rows.append(row)

        return timezones, error_rows
