from flask import request

from app.database import db
from app.models.consent import ConsentDoc, ConsentEvent
from app.utils.enum import (
    CONSENT_ACTION,
    CONSENT_DOC_TYPE,
    CONSENT_EVENT_TYPE,
)


def get_sender_info() -> dict:
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    return {
        'ip': ip,
        'user_agent': request.headers.get('User-Agent'),
        'device_fingerprint': request.headers.get('X-Device-Fingerprint'),
    }


def create_booking_consents(
    booking,
    granter_user_id=None,
    subject_ids=None,
    *,
    session=None,
):
    session = session or db.session
    subject_ids = subject_ids or []
    sender_info = get_sender_info()

    mappings = [
        (CONSENT_EVENT_TYPE.pd_processing, CONSENT_DOC_TYPE.pd_policy, subject_ids),
        (CONSENT_EVENT_TYPE.offer_acceptance, CONSENT_DOC_TYPE.offer, []),
    ]

    for event_type, doc_type, subs in mappings:
        doc = ConsentDoc.get_latest(doc_type, session=session)
        ConsentEvent.create(
            session=session,
            commit=False,
            type=event_type,
            granter_user_id=granter_user_id,
            booking_id=booking.id,
            doc_id=doc.id,
            action=CONSENT_ACTION.agree,
            subject_ids=subs,
            **sender_info,
        )

