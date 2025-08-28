from flask import request

from app.database import db
from app.models.consent import ConsentDoc, ConsentEvent
from app.utils.enum import (
    CONSENT_ACTION,
    CONSENT_DOC_TYPE,
    CONSENT_EVENT_TYPE,
)


def get_sender_info() -> dict:
    return {
        'ip': request.remote_addr,
        'user_agent': request.headers.get('User-Agent'),
        'device_fingerprint': request.headers.get('X-Device-Fingerprint'),
    }


def create_booking_consent(
    booking,
    event_type: CONSENT_EVENT_TYPE,
    doc_type: CONSENT_DOC_TYPE,
    granter_user_id=None,
    subject_ids=None,
    *,
    session=None,
):
    session = session or db.session
    subject_ids = subject_ids or []
    sender_info = get_sender_info()

    doc = ConsentDoc.get_latest(doc_type, session=session)

    # Single record per (user_id, booking_id, type) with nullable fields
    existing_q = session.query(ConsentEvent).filter(ConsentEvent.type == event_type)
    if granter_user_id is not None and booking.id is not None:
        existing_q = existing_q.filter(
            ConsentEvent.granter_user_id == granter_user_id,
            ConsentEvent.booking_id == booking.id,
        )
    elif granter_user_id is None and booking.id is not None:
        existing_q = existing_q.filter(
            ConsentEvent.granter_user_id.is_(None),
            ConsentEvent.booking_id == booking.id,
        )
    elif granter_user_id is not None and booking.id is None:
        existing_q = existing_q.filter(
            ConsentEvent.granter_user_id == granter_user_id,
            ConsentEvent.booking_id.is_(None),
        )

    existing = existing_q.first()
    if existing:
        return ConsentEvent.update(
            existing.id,
            session=session,
            commit=False,
            doc_id=doc.id,
            action=CONSENT_ACTION.agree,
            subject_ids=subject_ids,
            **sender_info,
        )
    else:
        return ConsentEvent.create(
            session=session,
            commit=False,
            type=event_type,
            granter_user_id=granter_user_id,
            booking_id=booking.id,
            doc_id=doc.id,
            action=CONSENT_ACTION.agree,
            subject_ids=subject_ids,
            **sender_info,
        )


def create_user_consent(
    user,
    event_type: CONSENT_EVENT_TYPE,
    doc_type: CONSENT_DOC_TYPE,
    *,
    session=None,
):
    session = session or db.session
    sender_info = get_sender_info()

    doc = ConsentDoc.get_latest(doc_type, session=session)

    # Single record per (user_id, booking_id=NULL, type)
    existing = (
        session.query(ConsentEvent)
        .filter(
            ConsentEvent.type == event_type,
            ConsentEvent.granter_user_id == user.id,
            ConsentEvent.booking_id.is_(None),
        )
        .first()
    )
    if existing:
        return ConsentEvent.update(
            existing.id,
            session=session,
            commit=False,
            doc_id=doc.id,
            action=CONSENT_ACTION.agree,
            subject_ids=[],
            **sender_info,
        )
    else:
        return ConsentEvent.create(
            session=session,
            commit=False,
            type=event_type,
            granter_user_id=user.id,
            booking_id=None,
            doc_id=doc.id,
            action=CONSENT_ACTION.agree,
            subject_ids=[],
            **sender_info,
        )
