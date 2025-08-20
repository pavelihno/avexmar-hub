import hashlib
import uuid
from typing import List, TYPE_CHECKING

from sqlalchemy import event
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import Mapped

from app.database import db
from app.models._base_model import BaseModel
from app.utils.enum import (
    CONSENT_DOC_TYPE,
    CONSENT_EVENT_TYPE,
    CONSENT_ACTION,
)

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.booking import Booking
    from app.models.passenger import Passenger


class ConsentDoc(BaseModel):
    __tablename__ = 'consent_docs'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.Enum(CONSENT_DOC_TYPE), nullable=False)
    version = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    hash_sha256 = db.Column(db.String(64), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('type', 'version', name='uix_consent_doc_type_version'),
    )

    def to_dict(self):
        return {
            'id': str(self.id),
            'type': self.type.value,
            'version': self.version,
            'content': self.content,
            'hash_sha256': self.hash_sha256,
            'created_at': self.created_at,
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['type', 'version'], descending=True)

    @classmethod
    def get_latest(cls, doc_type, *, session=None):
        session = session or db.session
        return (
            session.query(cls)
            .filter(cls.type == doc_type)
            .order_by(cls.version.desc())
            .first()
        )

    @classmethod
    def create(cls, *, session=None, commit=False, **data):
        session = session or db.session
        doc_type = data.get('type')
        max_version = (
            session.query(db.func.max(cls.version)).filter(cls.type == doc_type).scalar() or 0
        )
        data['version'] = max_version + 1
        return super().create(session=session, commit=commit, **data)

    @classmethod
    def update(cls, doc_id, *, session=None, commit=False, **data):
        session = session or db.session
        old_doc = cls.get_or_404(doc_id, session)
        content = data.get('content')
        if not content or content == old_doc.content:
            return old_doc
        max_version = (
            session.query(db.func.max(cls.version)).filter(cls.type == old_doc.type).scalar() or 0
        )
        new_data = {'type': old_doc.type, 'content': content, 'version': max_version + 1}
        return super().create(session=session, commit=commit, **new_data)


@event.listens_for(ConsentDoc, 'before_insert')
def set_consent_doc_hash(mapper, connection, target):
    target.hash_sha256 = hashlib.sha256(target.content.encode('utf-8')).hexdigest()


class ConsentEvent(BaseModel):
    __tablename__ = 'consent_events'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.Enum(CONSENT_EVENT_TYPE), nullable=False)
    granter_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    doc_id = db.Column(UUID(as_uuid=True), db.ForeignKey('consent_docs.id'), nullable=False)
    action = db.Column(db.Enum(CONSENT_ACTION), nullable=False)
    ip = db.Column(INET, nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    device_fingerprint = db.Column(db.String(128), nullable=True)

    doc: Mapped['ConsentDoc'] = db.relationship('ConsentDoc')
    subjects: Mapped[List['ConsentEventSubject']] = db.relationship(
        'ConsentEventSubject', back_populates='event', cascade='all, delete-orphan'
    )

    def to_dict(self):
        return {
            'id': str(self.id),
            'type': self.type.value,
            'granter_user_id': self.granter_user_id,
            'booking_id': self.booking_id,
            'doc_id': str(self.doc_id),
            'action': self.action.value,
            'ip': self.ip,
            'user_agent': self.user_agent,
            'device_fingerprint': self.device_fingerprint,
            'created_at': self.created_at,
            'subject_ids': [s.subject_id for s in self.subjects],
        }

    @classmethod
    def create(cls, *, session=None, commit=False, subject_ids=None, **data):
        session = session or db.session
        event = super().create(session=session, commit=False, **data)
        subject_ids = subject_ids or []
        for sid in subject_ids:
            ConsentEventSubject.create(
                session=session, commit=False, consent_event_id=event.id, subject_id=sid
            )
        if commit:
            session.commit()
        else:
            session.flush()
        return event

    @classmethod
    def update(cls, event_id, *, session=None, commit=False, subject_ids=None, **data):
        session = session or db.session
        event = super().update(event_id, session=session, commit=False, **data)
        if subject_ids is not None:
            session.query(ConsentEventSubject).filter_by(consent_event_id=event.id).delete()
            for sid in subject_ids:
                ConsentEventSubject.create(
                    session=session, commit=False, consent_event_id=event.id, subject_id=sid
                )
        if commit:
            session.commit()
        else:
            session.flush()
        return event


class ConsentEventSubject(BaseModel):
    __tablename__ = 'consent_event_subjects'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = db.Column(db.Integer, db.ForeignKey('passengers.id'), nullable=False)
    consent_event_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey('consent_events.id', ondelete='CASCADE'),
        nullable=False,
    )

    event: Mapped['ConsentEvent'] = db.relationship('ConsentEvent', back_populates='subjects')
    subject: Mapped['Passenger'] = db.relationship('Passenger')

    __table_args__ = (
        db.UniqueConstraint('consent_event_id', 'subject_id', name='uix_consent_event_subject'),
    )
