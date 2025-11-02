from datetime import datetime, timedelta

from app.celery_app import celery
from app.config import Config
from app.database import db
from app.models.booking import Booking
from app.models.booking_hold import BookingHold
from app.utils.enum import BOOKING_STATUS


@celery.task
def set_expired_bookings():
    now = datetime.now()
    session = db.session

    expired = (
        Booking.query.join(BookingHold)
        .filter(
            BookingHold.expires_at < now,
            Booking.status.notin_(Booking.FINAL_STATUSES),
        )
        .with_for_update()
        .all()
    )

    # Delete BookingHold for bookings in terminal statuses (completed, cancelled),
    # excluding expired to preserve expires_at for deletion tracking
    terminal_bookings = (
        Booking.query
        .outerjoin(BookingHold)
        .filter(
            Booking.status.in_(
                Booking.FINAL_STATUSES - {BOOKING_STATUS.expired}
            ),
            BookingHold.id.isnot(None)
        )
        .with_for_update()
        .all()
    )

    if not expired and not terminal_bookings:
        return 0

    expired_count = len(expired)
    try:
        # Transition bookings to expired status without deleting BookingHold
        for booking in expired:
            Booking.transition_status(
                booking.id,
                BOOKING_STATUS.expired,
                session=session,
                commit=False
            )

        # Delete BookingHold for terminal status bookings
        for booking in terminal_bookings:
            BookingHold.delete_by_booking_id(
                booking.id,
                session=session,
                commit=False
            )

        session.commit()
    except Exception:
        session.rollback()
        raise

    return expired_count


@celery.task
def delete_expired_bookings():
    expiration_threshold = datetime.now() - timedelta(days=Config.BOOKING_EXP_DELETION_DAYS)
    expired_bookings = (
        Booking.query
        .join(BookingHold)
        .filter(
            Booking.status == BOOKING_STATUS.expired,
            BookingHold.expires_at < expiration_threshold
        )
        .with_for_update()
        .all()
    )
    if not expired_bookings:
        return 0

    session = db.session
    count = len(expired_bookings)
    try:
        for booking in expired_bookings:
            Booking.delete(
                booking.id,
                session=session,
                commit=False
            )
        session.commit()
    except Exception:
        session.rollback()
        raise

    return count
