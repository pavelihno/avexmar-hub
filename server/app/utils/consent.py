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
