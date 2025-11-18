import uuid
from flask import request, jsonify, send_file
from io import BytesIO
from datetime import datetime, timedelta

from app.constants.files import BOOKING_PDF_FILENAME_TEMPLATE, ITINERARY_PDF_FILENAME_TEMPLATE
from app.constants.messages import BookingMessages, ExportMessages
from app.database import db
from app.config import Config

from app.models.booking import Booking
from app.models.booking_passenger import BookingPassenger
from app.models.booking_flight import BookingFlight
from app.models.flight_tariff import FlightTariff
from app.models.passenger import Passenger
from app.models.payment import Payment
from app.models.booking_hold import BookingHold
from app.models.booking_flight_passenger import BookingFlightPassenger
from app.models.ticket import Ticket
from app.middlewares.auth_middleware import current_user
from app.utils.business_logic import (
    calculate_price_details,
    get_booking_snapshot,
    get_seats_number,
    calculate_refund_details,
)
from app.utils.yookassa import create_payment, create_invoice, handle_yookassa_webhook
from app.utils.enum import (
    BOOKING_STATUS,
    CONSENT_EVENT_TYPE,
    CONSENT_DOC_TYPE,
    BOOKING_FLIGHT_PASSENGER_STATUS
)
from app.utils.storage import TicketManager
from app.utils.consent import create_booking_consent
from app.utils.pdf import generate_booking_pdf
from app.utils.datetime import format_date


@current_user
def get_booking_process_access(current_user, public_id):
    token = request.args.get('access_token')
    pages = Booking.get_accessible_pages(current_user, public_id, token)
    return jsonify({'pages': pages}), 200


@current_user
def create_booking_process(current_user):
    data = request.json or {}
    session = db.session

    outbound_id = int(data.get('outbound_id', 0))
    return_id = int(data.get('return_id', 0))
    outbound_tariff_id = int(data.get('outbound_tariff_id', 0))
    return_tariff_id = int(data.get('return_tariff_id', 0))
    raw_passengers = data.get('passengers', {})

    passenger_counts = {}
    for key, value in (raw_passengers or {}).items():
        try:
            count = int(value)
        except (TypeError, ValueError):
            continue
        if count > 0:
            passenger_counts[key] = count

    price_details = calculate_price_details(
        outbound_id,
        outbound_tariff_id,
        return_id,
        return_tariff_id,
        passenger_counts,
    )

    booking = Booking.create(
        session,
        commit=False,
        currency=price_details['currency'],
        fare_price=price_details['fare_price'],
        total_discounts=price_details['total_discounts'],
        fees=price_details['total_fees'],
        total_price=price_details['final_price'],
        passenger_counts=passenger_counts,
        user_id=current_user.id if current_user else None,
        access_token=uuid.uuid4(),
    )

    seats_number = get_seats_number(passenger_counts)

    if outbound_id and outbound_tariff_id:
        outbound_ft = FlightTariff.query.filter_by(
            flight_id=outbound_id,
            tariff_id=outbound_tariff_id,
        ).first_or_404()
        BookingFlight.create(
            session,
            commit=False,
            booking_id=booking.id,
            flight_tariff_id=outbound_ft.id,
            seats_number=seats_number,
        )
    if return_id and return_tariff_id:
        return_ft = FlightTariff.query.filter_by(
            flight_id=return_id,
            tariff_id=return_tariff_id,
        ).first_or_404()
        BookingFlight.create(
            session,
            commit=False,
            booking_id=booking.id,
            flight_tariff_id=return_ft.id,
            seats_number=seats_number,
        )
    expires_at = datetime.now() + timedelta(hours=Config.BOOKING_CONFIRMATION_EXP_HOURS)
    BookingHold.set_hold(
        booking.id,
        expires_at,
        session=session,
        commit=False,
    )
    session.commit()

    result = {
        'public_id': str(booking.public_id),
        'access_token': str(booking.access_token),
    }

    return jsonify(result), 201


@current_user
def create_booking_process_passengers(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    buyer = data.get('buyer', {})
    consent = bool(buyer.pop('consent', False))
    passengers = data.get('passengers') or []

    if not public_id:
        return jsonify({'message': ExportMessages.PUBLIC_ID_REQUIRED}), 400

    token = request.args.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)

    if not booking:
        return jsonify({'message': BookingMessages.BOOKING_NOT_FOUND}), 404

    session = db.session

    booking = Booking.update(
        booking.id, session=session, commit=False,
        user_id=current_user.id if current_user else None,
        **buyer
    )

    # Delete existing booking_passengers entities
    for bp in booking.booking_passengers:
        BookingPassenger.delete(bp.id, session=session, commit=False)

    # Link new passengers to booking
    processed_passenger_ids = set()
    for pdata in passengers:
        category = pdata.get('category')

        pdata['owner_user_id'] = current_user.id if current_user else None

        passenger = Passenger.get_existing_passenger(
            session,
            pdata,
        )

        if passenger is None:
            passenger = Passenger.create(
                session,
                commit=False,
                **pdata
            )

        bp = BookingPassenger.create(
            session,
            commit=False,
            booking_id=booking.id,
            passenger_id=passenger.id,
            category=category,
        )

        processed_passenger_ids.add(passenger.id)

    Booking.transition_status(
        id=booking.id,
        session=session,
        commit=False,
        to_status=BOOKING_STATUS.passengers_added,
    )

    if consent:
        create_booking_consent(
            booking,
            CONSENT_EVENT_TYPE.pd_agreement_acceptance,
            CONSENT_DOC_TYPE.pd_agreement,
            current_user.id if current_user else None,
            list(processed_passenger_ids),
            session=session,
        )
        create_booking_consent(
            booking,
            CONSENT_EVENT_TYPE.public_offer_acceptance,
            CONSENT_DOC_TYPE.public_offer,
            current_user.id if current_user else None,
            [],
            session=session,
        )

    session.commit()

    return jsonify({'status': 'ok'}), 200


@current_user
def confirm_booking_process(current_user):
    data = request.json or {}
    public_id = data.get('public_id')
    is_payment = data.get('is_payment', True)

    if not public_id:
        return jsonify({'message': ExportMessages.PUBLIC_ID_REQUIRED}), 400

    token = request.args.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)

    if not booking:
        return jsonify({'message': BookingMessages.BOOKING_NOT_FOUND}), 404

    session = db.session

    if booking.status == BOOKING_STATUS.passengers_added:
        Booking.transition_status(
            id=booking.id,
            session=session,
            commit=False,
            to_status=BOOKING_STATUS.confirmed,
        )

    if is_payment:
        BookingHold.set_hold(
            booking.id,
            datetime.now() + timedelta(hours=Config.BOOKING_PAYMENT_EXP_HOURS),
            session=session,
            commit=False,
        )
        payment = create_payment(booking)
    else:
        BookingHold.set_hold(
            booking.id,
            datetime.now() + timedelta(hours=Config.BOOKING_INVOICE_EXP_HOURS),
            session=session,
            commit=False,
        )
        payment = create_invoice(booking)

    session.commit()

    return jsonify(payment.to_dict()), 200


@current_user
def get_booking_process_details(current_user, public_id):
    token = request.args.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)

    if not booking:
        return jsonify({'message': BookingMessages.BOOKING_NOT_FOUND}), 404

    result = get_booking_snapshot(booking)

    return jsonify(result), 200


@current_user
def get_booking_process_pdf(current_user, public_id):
    token = request.args.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)

    if not booking:
        return jsonify({'message': BookingMessages.BOOKING_NOT_FOUND}), 404

    pdf = generate_booking_pdf(booking)

    return send_file(
        BytesIO(pdf),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=BOOKING_PDF_FILENAME_TEMPLATE.format(
            booking_number=booking.booking_number
        ),
    ), 200


@current_user
def get_booking_flight_itinerary_pdf(current_user, public_id, booking_flight_id):
    token = request.args.get('access_token')

    booking = Booking.get_if_has_access(current_user, public_id, token)

    if not booking:
        return jsonify({'message': BookingMessages.BOOKING_NOT_FOUND}), 404

    booking_flight = BookingFlight.get_or_404(
        booking_flight_id,
    )

    if not booking_flight.itinerary_receipt_path:
        return jsonify({'message': BookingMessages.ITINERARY_RECEIPT_NOT_FOUND}), 404

    ticket_storage = TicketManager()

    try:
        pdf_data = ticket_storage.read_file(
            booking_flight.itinerary_receipt_path,
            subfolder_name='imports'
        )
    except (ValueError, OSError):
        return jsonify({'message': BookingMessages.ITINERARY_RECEIPT_NOT_FOUND}), 404

    flight = booking_flight.flight_tariff.flight

    filename = ITINERARY_PDF_FILENAME_TEMPLATE.format(
        booking_number=booking.booking_number,
        flight_number=flight.airline_flight_number,
        date=format_date(flight.scheduled_departure)
    )

    return send_file(
        BytesIO(pdf_data),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename,
    ), 200


@current_user
def get_booking_process_payment(current_user, public_id):
    token = request.args.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)

    if not booking:
        return jsonify({'message': BookingMessages.BOOKING_NOT_FOUND}), 404

    payment = (
        booking.payments.order_by(Payment.id.desc())
        .first_or_404()
    )
    return jsonify(payment.to_dict()), 200


def _get_request_refund_details(current_user, public_id, ticket_id, send_request=False):
    token = request.args.get('access_token')
    booking = Booking.get_if_has_access(current_user, public_id, token)
    ticket = Ticket.get_or_404(ticket_id)

    if not booking:
        return jsonify({'message': BookingMessages.BOOKING_NOT_FOUND}), 404

    bfp = ticket.booking_flight_passenger
    ticket_status = bfp.status if bfp else None

    if not ticket or bfp.booking_passenger.booking_id != booking.id:
        return jsonify({'message': BookingMessages.TICKET_NOT_FOUND}), 404

    if booking.status != BOOKING_STATUS.completed:
        return jsonify({
            'success': False,
            'message': BookingMessages.BOOKING_REFUND_NOT_ALLOWED
        }), 400

    if ticket_status == BOOKING_FLIGHT_PASSENGER_STATUS.refunded:
        return jsonify({
            'success': False,
            'message': BookingMessages.TICKET_ALREADY_REFUNDED
        }), 400

    if ticket_status == BOOKING_FLIGHT_PASSENGER_STATUS.refund_in_progress:
        return jsonify({
            'success': False,
            'message': BookingMessages.TICKET_REFUND_ALREADY_REQUESTED
        }), 400

    if ticket_status != BOOKING_FLIGHT_PASSENGER_STATUS.ticketed:
        return jsonify({
            'success': False,
            'message': BookingMessages.TICKET_REFUND_STATUS_NOT_ALLOWED
        }), 400

    is_refundable, is_refundable_tariff, is_refundable_period, refund_details = calculate_refund_details(
        booking,
        ticket
    )

    if not is_refundable:
        error_message = None
        if not is_refundable_tariff:
            error_message = BookingMessages.TARIFF_REFUND_NOT_ALLOWED
        elif not is_refundable_period:
            error_message = BookingMessages.PERIOD_REFUND_NOT_ALLOWED

        return jsonify({
            'success': False,
            'is_refundable': is_refundable,
            'message': error_message
        }), 400

    if send_request:
        BookingFlightPassenger.update(
            ticket.booking_flight_passenger.id,
            status=BOOKING_FLIGHT_PASSENGER_STATUS.refund_in_progress,
            refund_request_at=datetime.now(),
            commit=True,
        )

    return jsonify({
        'success': True,
        'is_refundable': is_refundable,
        'refund_details': refund_details
    }), 200


@current_user
def get_request_refund_details(current_user, public_id, ticket_id):
    return _get_request_refund_details(
        current_user, public_id, ticket_id, send_request=False
    )


@current_user
def request_refund(current_user, public_id, ticket_id):
    return _get_request_refund_details(
        current_user, public_id, ticket_id, send_request=True
    )


def yookassa_webhook():
    payload = request.json or {}
    handle_yookassa_webhook(payload)
    return jsonify({'status': 'ok'}), 200
