import json
import re
import unicodedata
import xlrd

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from flask import jsonify, request
from sqlalchemy import and_, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, aliased

from app.constants.messages import FileMessages, TicketMessages
from app.constants.files import ITINERARY_PDF_FILENAME_TEMPLATE
from app.config import Config
from app.database import db
from app.middlewares.auth_middleware import admin_required
from app.models.airline import Airline
from app.models.booking import Booking
from app.models.booking_flight import BookingFlight
from app.models.booking_flight_passenger import BookingFlightPassenger
from app.models.booking_passenger import BookingPassenger
from app.models.flight import Flight
from app.models.flight_tariff import FlightTariff
from app.models.route import Route
from app.models.passenger import Passenger
from app.models.ticket import Ticket
from app.models.airport import Airport
from app.utils.datetime import parse_date, format_date, format_time
from app.utils.email import send_email, EMAIL_TYPE
from app.utils.storage import TicketManager
from app.utils.enum import BOOKING_STATUS, BOOKING_FLIGHT_PASSENGER_STATUS
from app.utils.passenger_categories import PASSENGER_CATEGORY_LABELS
from app.utils.business_logic import get_booking_details, get_booking_passenger_details


def _clean_string(value) -> str:
    if value is None:
        return ''
    if isinstance(value, float):
        text = str(int(value)) if value.is_integer() else str(value)
    elif isinstance(value, int):
        text = str(value)
    else:
        text = str(value)
    text = unicodedata.normalize('NFKC', text)
    return text.strip()


def _split_passenger_name(raw_name: str) -> Tuple[str, str, str]:
    cleaned = re.sub(r'[\s,]+', ' ', raw_name or '').strip()
    if not cleaned:
        return '', '', ''
    parts = cleaned.split(' ')
    last_name = parts[0] if parts else ''
    first_name = parts[1] if len(parts) > 1 else ''
    patronymic = ' '.join(parts[2:]) if len(parts) > 2 else ''
    return last_name, first_name, patronymic


def _serialize_booking(booking: Booking) -> Dict[str, Any]:
    return {
        'id': booking.id,
        'booking_number': booking.booking_number,
        'created_at': booking.created_at.isoformat(),
        'status': booking.status.value if booking.status else None,
        'email_address': booking.email_address,
    }


def _read_sheet(spreadsheet) -> xlrd.sheet.Sheet:
    filename = spreadsheet.filename or ''
    extension = Path(filename).suffix.lower()
    if extension != '.xls':
        raise ValueError(FileMessages.INVALID_FILE_TYPE)

    spreadsheet.stream.seek(0)
    file_bytes = spreadsheet.stream.read()
    spreadsheet.stream.seek(0)

    if not file_bytes:
        raise ValueError(FileMessages.FILE_REQUIRED)

    try:
        workbook = xlrd.open_workbook(file_contents=file_bytes)
    except xlrd.XLRDError as exc:
        raise ValueError(FileMessages.XLS_NOT_SUPPORTED) from exc

    sheet = workbook.sheet_by_index(0)
    return sheet


def _extract_ticket_data(sheet: xlrd.sheet.Sheet) -> Dict[str, Any]:
    if sheet.nrows <= 8:
        raise ValueError(TicketMessages.IMPORT_NO_HEADER)

    def get_cell(row: int, col: int):
        if row < sheet.nrows and col < sheet.ncols:
            return sheet.cell_value(row, col)
        return ''

    flight_line = _clean_string(get_cell(3, 0))
    flight_raw = flight_line.split(
        ':', 1
    )[-1].strip() if ':' in flight_line else flight_line

    route_line = _clean_string(get_cell(4, 0))
    route_value = route_line.split(
        ':', 1
    )[-1].strip() if ':' in route_line else route_line
    origin_code = None
    destination_code = None

    if route_value:
        cleaned_route = re.sub(r'\s+', '', route_value).upper()
        route_parts = re.split(r'[-–—]', cleaned_route)
        if len(route_parts) >= 2 and route_parts[0] and route_parts[1]:
            origin_code, destination_code = route_parts[0], route_parts[1]

    departure_line = _clean_string(get_cell(2, 0))
    departure_date_raw = departure_line.split(
        ':', 1
    )[-1].strip() if ':' in departure_line else departure_line
    departure_date = parse_date(departure_date_raw, '%d.%m.%Y')

    passengers: List[Dict[str, Optional[str]]] = []

    for row_idx in range(8, sheet.nrows):
        raw_name = _clean_string(get_cell(row_idx, 1)).upper()
        ticket_number = _clean_string(get_cell(row_idx, 10)).upper()
        document_number = _clean_string(
            get_cell(row_idx, 4)
        ).replace(' ', '').upper()
        birth_date = parse_date(get_cell(row_idx, 3), '%d.%m.%y')
        pnr = _clean_string(get_cell(row_idx, 11)).upper()

        if not any([raw_name, ticket_number, document_number, birth_date, pnr]):
            continue

        last_name, first_name, patronymic = _split_passenger_name(raw_name)

        passengers.append(
            {
                'order': len(passengers) + 1,
                'raw_name': raw_name,
                'last_name': last_name,
                'first_name': first_name,
                'patronymic_name': patronymic,
                'ticket_number': ticket_number,
                'document_number': document_number,
                'birth_date': birth_date,
                'pnr': pnr,
                'is_matched': False,
                'booking_flight_passenger_id': None,
                'ticketed_before': False,
            }
        )

    if not passengers:
        raise ValueError(TicketMessages.IMPORT_NO_PASSENGERS)

    airline_code = ''
    flight_number = ''
    if flight_raw:
        match = re.search(r'([A-Za-zА-Яа-яЁё]{1,4})\s*(\d{1,5})', flight_raw)
        if match:
            airline_code = match.group(1).upper()
            flight_number = match.group(2)

    return {
        'flight': {
            'raw': flight_raw,
            'airline_code': airline_code,
            'flight_number': flight_number,
            'departure_date': departure_date,
            'departure_date_raw': departure_date_raw,
            'route': {
                'raw': route_value,
                'origin_code': origin_code,
                'destination_code': destination_code,
            },
        },
        'passengers': passengers,
    }


def _find_booking_matches(parsed: Dict[str, Any]) -> Dict[str, Any]:
    flight_info = parsed.get('flight') or {}
    passengers = parsed.get('passengers') or []
    departure_date = flight_info.get('departure_date')
    flight_number = (flight_info.get('flight_number') or '').strip()
    airline_code = (flight_info.get('airline_code') or '').strip().upper()
    route_info = flight_info.get('route') or {}
    origin_code = (route_info.get('origin_code') or '').upper()
    destination_code = (route_info.get('destination_code') or '').upper()

    session = db.session

    result = {
        'warnings': [],
        'flight_candidates': [],
        'booking_candidates': [],
        'passengers': passengers,
    }

    # Missing flight information
    if not departure_date or not flight_number:
        result['warnings'].append(TicketMessages.IMPORT_FLIGHT_NOT_FOUND)
        return result

    # Search for matching flights
    query = Flight.query.join(Airline).filter(
        and_(
            Flight.flight_number == flight_number,
            Flight.scheduled_departure == departure_date,
        )
    )

    if airline_code:
        query = query.filter(
            or_(
                func.upper(Airline.iata_code) == airline_code,
                func.upper(Airline.internal_code) == airline_code,
            )
        )

    if origin_code and destination_code:
        origin_airport = aliased(Airport)
        destination_airport = aliased(Airport)

        query = (
            query.join(Route, Flight.route_id == Route.id)
            .join(
                origin_airport,
                Route.origin_airport_id == origin_airport.id,
            )
            .join(
                destination_airport,
                Route.destination_airport_id == destination_airport.id,
            )
            .filter(
                func.upper(origin_airport.internal_code) == origin_code,
                func.upper(
                    destination_airport.internal_code) == destination_code,
            )
        )

    flights = query.all()

    # No matching flights found
    if not flights:
        result['warnings'].append(TicketMessages.IMPORT_FLIGHT_NOT_FOUND)
        return result

    elif len(flights) > 1:
        result['warnings'].append(TicketMessages.IMPORT_MULTIPLE_FLIGHTS_FOUND)

    flight_ids = [flight.id for flight in flights]

    result['flight_candidates'] = [
        {
            'id': flight.id,
            'flight_number': flight.airline_flight_number,
            'scheduled_departure': flight.scheduled_departure.isoformat() if flight.scheduled_departure else None,
            'scheduled_departure_time': flight.scheduled_departure_time.isoformat() if flight.scheduled_departure_time else None,
        }
        for flight in flights
    ]

    booking_flight_passengers = (
        session.query(BookingFlightPassenger)
        .join(BookingPassenger, BookingFlightPassenger.booking_passenger_id == BookingPassenger.id)
        .join(Booking, BookingPassenger.booking_id == Booking.id)
        .join(Passenger, BookingPassenger.passenger_id == Passenger.id)
        .options(
            joinedload(
                BookingFlightPassenger.booking_passenger
            ).joinedload(
                BookingPassenger.passenger
            ).joinedload(
                Passenger.citizenship
            ),
            joinedload(
                BookingFlightPassenger.booking_passenger
            ).joinedload(
                BookingPassenger.booking
            ),
        )
        .filter(
            and_(
                BookingFlightPassenger.flight_id.in_(flight_ids),
                BookingFlightPassenger.status.in_(
                    [BOOKING_FLIGHT_PASSENGER_STATUS.ticket_in_progress]
                ),
                Booking.status.in_([BOOKING_STATUS.completed]),
            )
        ).all()
    )

    if not booking_flight_passengers:
        result['warnings'].append(TicketMessages.IMPORT_BOOKINGS_NOT_FOUND)
        return result

    def _make_passenger_key(passenger_data: Dict[str, Any]) -> str:
        """Create a unique key from passenger data for matching"""
        last_name = (passenger_data.get('last_name') or '').upper().strip()
        first_name = (passenger_data.get('first_name') or '').upper().strip()
        patronymic = (
            passenger_data.get('patronymic_name') or ''
        ).upper().strip()
        document = (
            passenger_data.get('document_number') or ''
        ).upper().strip()
        birth_date = passenger_data.get('birth_date') or ''

        return f"{last_name}|{first_name}|{patronymic}|{document}|{birth_date}"

    bookings: Dict[int, Booking] = {}
    matches_by_key: Dict[str, List[BookingFlightPassenger]] = {}

    for bfp in booking_flight_passengers:
        booking_passenger = bfp.booking_passenger
        passenger_data = get_booking_passenger_details(booking_passenger)
        booking = booking_passenger.booking if booking_passenger else None

        if booking:
            bookings.setdefault(booking.id, booking)

        if passenger_data:
            db_key = _make_passenger_key({
                'last_name': passenger_data.get('last_name') or '',
                'first_name': passenger_data.get('first_name') or '',
                'patronymic_name': passenger_data.get('patronymic_name') or '',
                'document_number': passenger_data.get('document_number') or '',
                'birth_date': passenger_data.get('birth_date') or '',
            })
            matches_by_key.setdefault(db_key, []).append(bfp)

    matched_booking_ids = set()
    multiple_matches_detected = False

    for passenger in passengers:
        key = _make_passenger_key(passenger)
        matches = matches_by_key.get(key, [])

        if len(matches) == 1:
            bfp = matches[0]
            booking_passenger = bfp.booking_passenger
            booking = booking_passenger.booking if booking_passenger else None

            passenger['is_matched'] = True
            passenger['booking_flight_passenger_id'] = bfp.id
            passenger['ticketed_before'] = bfp.status == BOOKING_FLIGHT_PASSENGER_STATUS.ticketed

            if booking:
                matched_booking_ids.add(booking.id)

        elif len(matches) > 1:
            passenger['is_matched'] = False
            multiple_matches_detected = True

        else:
            passenger['is_matched'] = False

    if multiple_matches_detected or len(matched_booking_ids) > 1:
        result['warnings'].append(
            TicketMessages.IMPORT_PASSENGERS_MULTIPLE_MATCHES
        )

    result['booking_candidates'] = [
        _serialize_booking(bookings[booking_id])
        for booking_id in matched_booking_ids
    ]

    if any(not passenger['is_matched'] for passenger in result['passengers']):
        result['warnings'].append(TicketMessages.IMPORT_PASSENGERS_NOT_MATCHED)

    return result


@admin_required
def import_tickets(current_user):
    spreadsheet = request.files.get('spreadsheet')

    if not spreadsheet:
        return jsonify({'message': FileMessages.NO_FILE_PROVIDED, 'field': 'spreadsheet'}), 400

    try:
        sheet = _read_sheet(spreadsheet)
        parsed = _extract_ticket_data(sheet)
        matching_result = _find_booking_matches(parsed)
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400
    except Exception as exc:
        return jsonify({'message': str(exc)}), 500

    flight_candidates = matching_result.get('flight_candidates', [])
    booking_candidates = matching_result.get('booking_candidates', [])
    warnings = matching_result.get('warnings', [])
    passengers = matching_result.get('passengers', [])

    # Only include flight/booking info if exactly one match was found
    flight = flight_candidates[0] if len(flight_candidates) == 1 else None
    booking = booking_candidates[0] if len(booking_candidates) == 1 else None

    response = {
        'parsed_flight': parsed.get('flight'),
        'flight': flight,
        'booking': booking,
        'passengers': passengers,
        'warnings': warnings,
    }

    return jsonify(response), 200


@admin_required
def confirm_import_tickets(current_user):
    itinerary_pdf = request.files.get('itinerary')
    passengers_payload_raw = request.form.get('passengers')
    booking_id = request.form.get('booking_id')
    flight_id = request.form.get('flight_id')

    if not itinerary_pdf:
        return jsonify({'message': FileMessages.NO_FILE_PROVIDED, 'field': 'itinerary'}), 400

    if not passengers_payload_raw:
        return jsonify({'message': TicketMessages.IMPORT_PASSENGERS_PAYLOAD_REQUIRED, 'field': 'passengers'}), 400

    if not booking_id:
        return jsonify({'message': TicketMessages.IMPORT_BOOKING_REQUIRED, 'field': 'booking_id'}), 400

    if not flight_id:
        return jsonify({'message': TicketMessages.IMPORT_FLIGHT_REQUIRED, 'field': 'flight_id'}), 400

    try:
        passengers_payload = json.loads(passengers_payload_raw)
    except (TypeError, ValueError):
        return jsonify({'message': TicketMessages.IMPORT_PASSENGERS_PAYLOAD_REQUIRED, 'field': 'passengers'}), 400

    if not isinstance(passengers_payload, list):
        return jsonify({'message': TicketMessages.IMPORT_PASSENGERS_PAYLOAD_REQUIRED, 'field': 'passengers'}), 400

    booking = Booking.get_or_404(booking_id)
    flight = Flight.get_or_404(flight_id)

    # Collect valid ticket data from passengers
    skipped_count = 0
    ticket_data = []  # List of (bfp_id, ticket_number)
    seen_bfp_ids = set()
    seen_ticket_numbers = set()

    for passenger in passengers_payload:
        if not isinstance(passenger, dict):
            skipped_count += 1
            continue

        # Skip if not matched or already ticketed
        if not passenger.get('is_matched') or passenger.get('ticketed_before'):
            skipped_count += 1
            continue

        ticket_number = _clean_string(passenger.get('ticket_number')).upper()
        if not ticket_number:
            skipped_count += 1
            continue

        try:
            bfp_id = int(passenger.get('booking_flight_passenger_id'))
        except (TypeError, ValueError):
            skipped_count += 1
            continue

        # Skip duplicates in the payload
        if bfp_id in seen_bfp_ids or ticket_number in seen_ticket_numbers:
            skipped_count += 1
            continue

        ticket_data.append((bfp_id, ticket_number))
        seen_bfp_ids.add(bfp_id)
        seen_ticket_numbers.add(ticket_number)

    if not ticket_data:
        summary_message = TicketMessages.import_summary(0, skipped_count)
        return jsonify({
            'message': summary_message,
            'created_count': 0,
            'skipped_count': skipped_count,
        }), 200

    # Load booking flight passengers
    bfp_ids = [bfp_id for bfp_id, _ in ticket_data]
    booking_flight_passengers = (
        BookingFlightPassenger.query
        .options(joinedload(BookingFlightPassenger.booking_passenger))
        .filter(BookingFlightPassenger.id.in_(bfp_ids))
        .all()
    )
    bfp_by_id = {bfp.id: bfp for bfp in booking_flight_passengers}

    # Filter valid pairs and check for already ticketed
    valid_pairs = []
    for bfp_id, ticket_number in ticket_data:
        bfp = bfp_by_id.get(bfp_id)
        if not bfp or bfp.status == BOOKING_FLIGHT_PASSENGER_STATUS.ticketed:
            skipped_count += 1
            continue
        valid_pairs.append((bfp, ticket_number))

    if not valid_pairs:
        summary_message = TicketMessages.import_summary(0, skipped_count)
        return jsonify({
            'message': summary_message,
            'created_count': 0,
            'skipped_count': skipped_count,
        }), 200

    # Find the BookingFlight for this booking and flight
    session = db.session
    booking_flight = (
        session.query(BookingFlight)
        .join(FlightTariff, BookingFlight.flight_tariff_id == FlightTariff.id)
        .filter(
            and_(
                BookingFlight.booking_id == booking.id,
                FlightTariff.flight_id == flight.id,
            )
        )
        .first()
    )

    if not booking_flight:
        return jsonify({
            'message': TicketMessages.IMPORT_BOOKING_FLIGHT_NOT_FOUND,
            'created_count': 0,
            'skipped_count': skipped_count,
        }), 400

    # Save PDF file
    ticket_storage = TicketManager()
    try:
        _, pdf_filename = ticket_storage.save_file(
            itinerary_pdf, subfolder_name='imports'
        )
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400

    # Create tickets and update statuses
    created_count = 0

    try:
        for booking_flight_passenger, ticket_number in valid_pairs:
            Ticket.create(
                session=session,
                commit=False,
                ticket_number=ticket_number,
                booking_flight_passenger_id=booking_flight_passenger.id,
            )
            BookingFlightPassenger.update(
                booking_flight_passenger.id,
                session=session,
                commit=False,
                status=BOOKING_FLIGHT_PASSENGER_STATUS.ticketed,
            )
            created_count += 1

        BookingFlight.update(
            booking_flight.id,
            session=session,
            commit=False,
            itinerary_receipt_path=pdf_filename,
        )

        session.commit()

    except IntegrityError:
        session.rollback()

        ticket_storage.delete_file(pdf_filename, subfolder_name='imports')

        return jsonify({
            'message': TicketMessages.IMPORT_TICKETS_DUPLICATE_NUMBER,
            'created_count': created_count,
            'skipped_count': skipped_count,
        }), 400

    except Exception as exc:
        session.rollback()

        ticket_storage.delete_file(pdf_filename, subfolder_name='imports')

        return jsonify({'message': str(exc)}), 500

    pdf_data = ticket_storage.read_file(
        pdf_filename, subfolder_name='imports'
    )

    # Prepare email information
    booking_url = (
        f'{Config.CLIENT_URL}/booking/{booking.public_id}/completion'
        f'?access_token={booking.access_token}'
    )

    flight_dict = flight.to_dict(return_children=True)
    route = flight_dict.get('route') or {}
    origin = route.get('origin_airport') or {}
    dest = route.get('destination_airport') or {}

    flight_info = {
        'number': flight.airline_flight_number,
        'from': f"{origin.get('city_name')} ({origin.get('iata_code')})",
        'to': f"{dest.get('city_name')} ({dest.get('iata_code')})",
        'departure': f"{format_date(flight.scheduled_departure)} {format_time(flight.scheduled_departure_time)}",
        'arrival': f"{format_date(flight.scheduled_arrival)} {format_time(flight.scheduled_arrival_time)}",
    }
    details = get_booking_details(booking)

    passengers = []
    for p in details.get('passengers', []):
        name = ' '.join(
            filter(None, [p.get('last_name'), p.get('first_name')])
        ).strip()
        passengers.append(
            {
                'name': name,
                'category': PASSENGER_CATEGORY_LABELS.get(
                    p.get('category'), p.get('category')
                ),
            }
        )

    # Format attachment filename
    attachment_filename = ITINERARY_PDF_FILENAME_TEMPLATE.format(
        booking_number=booking.booking_number,
        flight_number=flight.airline_flight_number,
        date=format_date(flight.scheduled_departure)
    )

    send_email(
        EMAIL_TYPE.ticket_issued,
        recipients=booking.email_address,
        booking_number=booking.booking_number,
        booking_url=booking_url,
        ticket_count=created_count,
        flight_number=flight_info['number'],
        flight=flight_info,
        passengers=passengers,
        attachments=[{
            'filename': attachment_filename,
            'content_type': 'application/pdf',
            'data': pdf_data,
        }],
    )

    message = TicketMessages.import_summary(created_count, skipped_count)

    return jsonify({
        'message': message,
        'created_count': created_count,
        'skipped_count': skipped_count,
    }), 200
