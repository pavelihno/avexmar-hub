from datetime import datetime

from app.celery_app import celery
from app.database import db
from app.models.booking import Booking
from app.models.booking_hold import BookingHold
from app.utils.enum import BOOKING_STATUS


@celery.task
def cleanup_expired_bookings():
    now = datetime.now()
    expired = (
        Booking.query.join(BookingHold)
        .filter(
            BookingHold.expires_at < now,
            Booking.status.notin_(Booking.TERMINAL),
        )
        .with_for_update()
        .all()
    )
    if not expired:
        return 0

    session = db.session
    count = len(expired)
    try:
        for booking in expired:
            BookingHold.delete_by_booking_id(booking.id, session=session, commit=False)
            Booking.transition_status(booking.id, BOOKING_STATUS.expired, session=session, commit=False)
        session.commit()
    except Exception:
        session.rollback()
        raise

    return count
