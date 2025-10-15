from zoneinfo import ZoneInfo
from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Session, Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.utils.xlsx import parse_upload_xlsx_template, get_upload_xlsx_template, get_upload_xlsx_report

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

    upload_required_fields = ['name']

    def get_tz(self):
        return ZoneInfo(self.name)

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['name'], descending=False)

    @classmethod
    def get_upload_xlsx_template(cls):
        return get_upload_xlsx_template(
            cls.upload_fields,
            model_class=cls,
            required_fields=cls.upload_required_fields,
        )

    @classmethod
    def get_upload_xlsx_report(cls, error_rows):
        return get_upload_xlsx_report(
            cls.upload_fields,
            cls,
            cls.upload_required_fields,
            [],
            error_rows
        )

    @classmethod
    def upload_from_file(
        cls,
        file,
        session: Session | None = None,
    ):
        session = session or db.session
        rows = parse_upload_xlsx_template(
            file,
            cls.upload_fields,
            model_class=cls,
            required_fields=cls.upload_required_fields,
        )

        def process_row(row, row_session: Session):
            return cls.create(
                row_session,
                name=str(row.get('name')),
                commit=False,
            )

        return super()._process_upload_rows(rows, process_row, session=session)
