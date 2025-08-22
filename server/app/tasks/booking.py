from datetime import datetime

from app.celery_app import celery
from app.database import db
from app.models.booking import Booking
from app.models.booking_hold import BookingHold
from app.utils.enum import BOOKING_STATUS


@celery.task
def cleanup_expired_bookings():
    now = datetime.utcnow()
    expired = (
        Booking.query.join(BookingHold)
        .filter(BookingHold.expires_at < now)
        .with_for_update()
        .all()
    )
    if not expired:
        return 0

    with db.session.begin():
        for booking in expired:
            Booking.transition_status(
                booking.id,
                BOOKING_STATUS.expired,
                session=db.session,
                commit=False,
            )
            db.session.delete(booking)

    return len(expired)
