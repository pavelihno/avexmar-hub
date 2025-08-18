from zoneinfo import ZoneInfo
from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.utils.xlsx import parse_xlsx, generate_xlsx_template

if TYPE_CHECKING:
    from app.models.airport import Airport


class Timezone(BaseModel):
    __tablename__ = 'timezones'

    name = db.Column(db.String, nullable=False, unique=True)

    airports: Mapped[List['Airport']] = db.relationship('Airport', back_populates='timezone', lazy='dynamic')

    def to_dict(self, return_children=False):
        return {
            'id': self.id,
            'name': self.name,
        }

    upload_fields = {
        'name': 'Часовой пояс',
    }

    upload_text_fields = ['name']

    def get_tz(self):
        """Return the timezone as a ZoneInfo object"""
        return ZoneInfo(self.name)

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['name'], descending=False)

    @classmethod
    def get_xlsx_template(cls):
        return generate_xlsx_template(cls.upload_fields, text_fields=cls.upload_text_fields)

    @classmethod
    def upload_from_file(
        cls,
        file,
        session: Session | None = None,
    ):
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
                    tz = cls.create(
                        session,
                        name=str(row.get('name')),
                        commit=False,
                    )
                    timezones.append(tz)
                except Exception as e:
                    row['error'] = str(e)

            if row.get('error'):
                error_rows.append(row)

        session.commit()

        return timezones, error_rows
