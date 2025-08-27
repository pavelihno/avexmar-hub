import hashlib
import uuid
from typing import List, TYPE_CHECKING

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

    events: Mapped[List['ConsentEvent']] = db.relationship(
        'ConsentEvent', back_populates='doc', lazy='dynamic'
    )

    __table_args__ = (
        db.UniqueConstraint('type', 'version', name='uix_consent_doc_type_version'),
    )

    @staticmethod
    def _calc_hash(content: str) -> str:
        return hashlib.sha256((content or '').encode('utf-8')).hexdigest()

    def to_dict(self):
        return {
            'id': str(self.id),
            'type': self.type.value,
            'version': self.version,
            'content': self.content,
            'hash_sha256': self.hash_sha256,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }

    @classmethod
    def get_all(cls):
        return super().get_all(sort_by=['type', 'version'], descending=False)

    @classmethod
    def get_latest(cls, doc_type, *, session=None):
        session = session or db.session
        return (
            session.query(cls)
            .filter(cls.type == doc_type)
            .order_by(cls.version.desc())
            .first_or_404()
        )

    @classmethod
    def create(cls, *, session=None, commit=False, **data):
        session = session or db.session
        doc_type = data.get('type')
        max_version = (
            session.query(db.func.max(cls.version)).filter(cls.type == doc_type).scalar() or 0
        )
        data['version'] = max_version + 1
        data['hash_sha256'] = cls._calc_hash(data['content'])
        return super().create(session=session, commit=commit, **data)

    @classmethod
    def update(cls, doc_id, *, session=None, commit=False, **data):
        session = session or db.session
        old_doc = cls.get_or_404(doc_id, session)
        content = data.get('content')
        doc_type = data.get('type', old_doc.type)

        new_hash = cls._calc_hash(content)
        if new_hash != old_doc.hash_sha256:
            latest_doc = cls.get_latest(doc_type, session=session)
            if latest_doc.id == old_doc.id and latest_doc.events.count() > 0:
                return cls.create(
                    session=session,
                    commit=commit,
                    **{**data, 'id': None, 'type': doc_type},
                )
            data['hash_sha256'] = new_hash
        return super().update(doc_id, session=session, commit=commit, **data)


class ConsentEvent(BaseModel):
    __tablename__ = 'consent_events'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.Enum(CONSENT_EVENT_TYPE), nullable=False)
    granter_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True)
    doc_id = db.Column(UUID(as_uuid=True), db.ForeignKey('consent_docs.id'), nullable=False)
    action = db.Column(db.Enum(CONSENT_ACTION), nullable=False)
    ip = db.Column(INET, nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    device_fingerprint = db.Column(db.String(128), nullable=True)

    doc: Mapped['ConsentDoc'] = db.relationship('ConsentDoc', back_populates='events')
    granter_user: Mapped['User'] = db.relationship('User', back_populates='consent_events')
    booking: Mapped['Booking'] = db.relationship('Booking', back_populates='consent_events')
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
            'subject_ids': [s.subject_id for s in self.subjects],
            'created_at': self.created_at,
            'updated_at': self.updated_at,
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
