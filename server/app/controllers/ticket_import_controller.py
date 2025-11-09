import re
import unicodedata
import xlrd

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from flask import jsonify, request
from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload

from app.constants.messages import FileMessages, TicketMessages
from app.database import db
from app.middlewares.auth_middleware import admin_required
from app.models.airline import Airline
from app.models.booking import Booking
from app.models.booking_flight import BookingFlight
from app.models.booking_passenger import BookingPassenger
from app.models.flight import Flight
from app.models.flight_tariff import FlightTariff
from app.models.passenger import Passenger
from app.utils.datetime import parse_date
from app.utils.storage import TicketManager
from app.utils.enum import BOOKING_STATUS


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
                'booking_id': None,
                'booking_passenger_id': None,
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

    # Response structure
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
        Flight.flight_number == flight_number,
        Flight.scheduled_departure == departure_date,
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

    # Search for bookings associated with the flights
    bookings = (
        session.query(Booking)
        .join(BookingFlight, BookingFlight.booking_id == Booking.id)
        .join(FlightTariff, FlightTariff.id == BookingFlight.flight_tariff_id)
        .filter(FlightTariff.flight_id.in_(flight_ids))
        .filter(Booking.status.in_([BOOKING_STATUS.completed]))
        .all()
    )

    # No bookings found for the flights
    if not bookings:
        result['warnings'].append(TicketMessages.IMPORT_BOOKINGS_NOT_FOUND)
        return result

    booking_ids = [b.id for b in bookings]

    result['booking_candidates'] = [
        _serialize_booking(booking)
        for booking in bookings
    ]

    # Create a lookup dictionary for file passengers using unique key
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

    # Index file passengers by their unique key
    file_passengers_by_key = {}
    for passenger in passengers:
        key = _make_passenger_key(passenger)
        file_passengers_by_key[key] = passenger

    # Fetch all booking passengers that potentially match file passengers
    booking_passengers_query = (
        session.query(BookingPassenger)
        .join(Passenger, BookingPassenger.passenger_id == Passenger.id)
        .options(
            joinedload(
                BookingPassenger.passenger
            ).joinedload(
                Passenger.citizenship
            )
        )
        .filter(BookingPassenger.booking_id.in_(booking_ids))
    )

    booking_passengers = booking_passengers_query.all()

    booking_passengers_by_booking = {}

    for bp in booking_passengers:
        passenger_entity = bp.passenger
        if passenger_entity:
            db_key = _make_passenger_key({
                'last_name': (passenger_entity.last_name or ''),
                'first_name': (passenger_entity.first_name or ''),
                'patronymic_name': (passenger_entity.patronymic_name or ''),
                'document_number': passenger_entity.document_number or '',
                'birth_date': passenger_entity.birth_date.isoformat() if passenger_entity.birth_date else '',
            })

            if bp.booking_id not in booking_passengers_by_booking:
                booking_passengers_by_booking[bp.booking_id] = {}

            booking_passengers_by_booking[bp.booking_id][db_key] = bp

    matched_bookings = []
    matched_file_passengers = {}

    for booking in bookings:
        booking_passengers_dict = booking_passengers_by_booking.get(
            booking.id, {}
        )

        match_counter = 0

        for file_key, file_passenger in file_passengers_by_key.items():
            if file_key in booking_passengers_dict:
                bp = booking_passengers_dict[file_key]
                matched_file_passengers[file_key] = {
                    'booking_id': booking.id,
                    'booking_passenger_id': bp.id
                }
                match_counter += 1

        if match_counter > 0:
            matched_bookings.append(_serialize_booking(booking))

    # Check for multiple booking matches
    if len(matched_bookings) > 1:
        result['warnings'].append(
            TicketMessages.IMPORT_PASSENGERS_MULTIPLE_MATCHES)

    # Matched file passengers with booking passengers
    for passenger in passengers:
        key = _make_passenger_key(passenger)
        if key in matched_file_passengers:
            matched_file_passenger = matched_file_passengers[key]
            passenger['is_matched'] = True
            passenger['booking_id'] = matched_file_passenger['booking_id']
            passenger['booking_passenger_id'] = matched_file_passenger['booking_passenger_id']
        else:
            passenger['is_matched'] = False

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
    flight_id = request.form.get('flight_id')
    booking_id = request.form.get('booking_id')

    if not itinerary_pdf:
        return jsonify({'message': FileMessages.NO_FILE_PROVIDED, 'field': 'itinerary'}), 400

    if not flight_id:
        return jsonify({'message': TicketMessages.IMPORT_FLIGHT_REQUIRED, 'field': 'flight_id'}), 400

    if not booking_id:
        return jsonify({'message': TicketMessages.IMPORT_BOOKING_REQUIRED, 'field': 'booking_id'}), 400

    ticket_storage = TicketManager()

    try:
        pdf_relative_path, pdf_filename = ticket_storage.save_file(
            itinerary_pdf, subfolder_name='imports'
        )

        return jsonify({
            'pdf_path': pdf_relative_path,
            'flight_id': flight_id,
            'booking_id': booking_id,
        }), 200

    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400
