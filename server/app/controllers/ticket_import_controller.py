import json
import re
import unicodedata
import xlrd

from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from flask import jsonify, request
from sqlalchemy import and_, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from app.constants.messages import FileMessages, TicketMessages
from app.database import db
from app.middlewares.auth_middleware import admin_required
from app.models.airline import Airline
from app.models.booking import Booking
from app.models.booking_flight_passenger import BookingFlightPassenger
from app.models.booking_passenger import BookingPassenger
from app.models.flight import Flight
from app.models.passenger import Passenger
from app.models.ticket import Ticket
from app.utils.datetime import parse_date
from app.utils.storage import TicketManager
from app.utils.enum import BOOKING_STATUS, BOOKING_FLIGHT_PASSENGER_STATUS


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
            'route': route_value,
        },
        'passengers': passengers,
    }


def _find_booking_matches(parsed: Dict[str, Any]) -> Dict[str, Any]:
    flight_info = parsed.get('flight') or {}
    passengers = parsed.get('passengers') or []
    departure_date = flight_info.get('departure_date')
    flight_number = (flight_info.get('flight_number') or '').strip()
    airline_code = (flight_info.get('airline_code') or '').strip().upper()

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
        passenger_entity = booking_passenger.passenger if booking_passenger else None
        booking = booking_passenger.booking if booking_passenger else None

        if booking:
            bookings.setdefault(booking.id, booking)

        if passenger_entity:
            db_key = _make_passenger_key({
                'last_name': passenger_entity.last_name or '',
                'first_name': passenger_entity.first_name or '',
                'patronymic_name': passenger_entity.patronymic_name or '',
                'document_number': passenger_entity.document_number or '',
                'birth_date': passenger_entity.birth_date.isoformat() if passenger_entity.birth_date else '',
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

    if not itinerary_pdf:
        return jsonify({'message': FileMessages.NO_FILE_PROVIDED, 'field': 'itinerary'}), 400

    if not passengers_payload_raw:
        return jsonify({'message': TicketMessages.IMPORT_PASSENGERS_PAYLOAD_REQUIRED, 'field': 'passengers'}), 400

    try:
        passengers_payload = json.loads(passengers_payload_raw)
    except (TypeError, ValueError):
        return jsonify({'message': TicketMessages.IMPORT_PASSENGERS_PAYLOAD_REQUIRED, 'field': 'passengers'}), 400

    if not isinstance(passengers_payload, list):
        return jsonify({'message': TicketMessages.IMPORT_PASSENGERS_PAYLOAD_REQUIRED, 'field': 'passengers'}), 400

    def _collect_candidate_map(payload: List[Dict[str, Any]]) -> Tuple[Dict[int, str], int]:
        skipped = 0
        mapping: Dict[int, str] = {}
        seen_numbers: Set[str] = set()

        for passenger in payload:
            if not isinstance(passenger, dict):
                skipped += 1
                continue

            if not passenger.get('is_matched') or passenger.get('ticketed_before'):
                skipped += 1
                continue

            ticket_number = _clean_string(passenger.get('ticket_number')).upper()
            if not ticket_number:
                skipped += 1
                continue

            bfp_id_raw = passenger.get('booking_flight_passenger_id')
            try:
                bfp_id = int(bfp_id_raw)
            except (TypeError, ValueError):
                skipped += 1
                continue

            if bfp_id in mapping or ticket_number in seen_numbers:
                skipped += 1
                continue

            mapping[bfp_id] = ticket_number
            seen_numbers.add(ticket_number)

        return mapping, skipped

    def _load_valid_pairs(
        mapping: Dict[int, str],
        *,
        skipped: int,
    ) -> Tuple[List[Tuple[BookingFlightPassenger, str]], int]:
        if not mapping:
            return [], skipped

        booking_flight_passengers = (
            BookingFlightPassenger.query
            .options(joinedload(BookingFlightPassenger.booking_passenger))
            .filter(BookingFlightPassenger.id.in_(mapping.keys()))
            .all()
        )
        bfp_by_id = {bfp.id: bfp for bfp in booking_flight_passengers}
        valid: List[Tuple[BookingFlightPassenger, str]] = []

        for bfp_id, ticket_number in mapping.items():
            bfp = bfp_by_id.get(bfp_id)
            if not bfp:
                skipped += 1
                continue

            if bfp.status == BOOKING_FLIGHT_PASSENGER_STATUS.ticketed:
                skipped += 1
                continue

            valid.append((bfp, ticket_number))

        return valid, skipped

    def _filter_existing_numbers(
        pairs: List[Tuple[BookingFlightPassenger, str]],
        skipped: int,
    ) -> Tuple[List[Tuple[BookingFlightPassenger, str]], int]:
        if not pairs:
            return [], skipped

        ticket_numbers = [ticket_number for _, ticket_number in pairs]
        existing_numbers = set()
        if ticket_numbers:
            existing_numbers = {
                value
                for (value,) in db.session.query(Ticket.ticket_number).filter(
                    Ticket.ticket_number.in_(ticket_numbers)
                ).all()
            }

        final: List[Tuple[BookingFlightPassenger, str]] = []
        for bfp, ticket_number in pairs:
            if ticket_number in existing_numbers:
                skipped += 1
                continue
            final.append((bfp, ticket_number))

        return final, skipped

    candidate_map, skipped_count = _collect_candidate_map(passengers_payload)

    if not candidate_map:
        summary_message = TicketMessages.import_summary(0, skipped_count)
        return jsonify({
            'message': summary_message,
            'created_count': 0,
            'skipped_count': skipped_count,
        }), 200

    valid_pairs, skipped_count = _load_valid_pairs(
        candidate_map,
        skipped=skipped_count,
    )

    final_pairs, skipped_count = _filter_existing_numbers(valid_pairs, skipped_count)

    if not final_pairs:
        summary_message = TicketMessages.import_summary(0, skipped_count)
        return jsonify({
            'message': summary_message,
            'created_count': 0,
            'skipped_count': skipped_count,
        }), 200

    ticket_storage = TicketManager()
    created_count = 0

    try:
        _pdf_path, pdf_filename = ticket_storage.save_file(
            itinerary_pdf, subfolder_name='imports'
        )
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400

    session = db.session

    try:
        for booking_flight_passenger, ticket_number in final_pairs:
            ticket = Ticket(
                ticket_number=ticket_number,
                booking_flight_passenger_id=booking_flight_passenger.id,
            )
            session.add(ticket)
            booking_flight_passenger.status = BOOKING_FLIGHT_PASSENGER_STATUS.ticketed
            created_count += 1

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

    message = TicketMessages.import_summary(created_count, skipped_count)

    return jsonify({
        'message': message,
        'created_count': created_count,
        'skipped_count': skipped_count,
    }), 200
