import zipfile
from collections import defaultdict
from xlwt import Workbook, XFStyle, Font
from datetime import datetime
from io import BytesIO

from flask import request, jsonify, send_file
from sqlalchemy.orm import joinedload

from app.constants.branding import GENDER_LABELS
from app.constants.files import (
    FLIGHT_PASSENGERS_EXPORT_FILENAME_TEMPLATE,
    PENDING_PASSENGERS_EXPORT_FILENAME_TEMPLATE,
)
from app.constants.messages import PassengerMessages
from app.database import db
from app.middlewares.auth_middleware import admin_required
from app.models.booking import Booking
from app.models.booking_flight import BookingFlight
from app.models.booking_flight_passenger import BookingFlightPassenger
from app.models.booking_passenger import BookingPassenger
from app.models.flight import Flight
from app.models.flight_tariff import FlightTariff
from app.models.passenger import Passenger
from app.models.route import Route
from app.utils.datetime import combine_date_time, format_date, format_datetime, parse_date
from app.utils.enum import (
    BOOKING_FLIGHT_PASSENGER_STATUS,
    BOOKING_STATUS,
    PASSENGER_CATEGORY,
    SEAT_CLASS,
)
from app.utils.business_logic import get_booking_passenger_details

SEAT_CLASS_CODES = {
    SEAT_CLASS.economy: 'Y',
    SEAT_CLASS.business: 'C',
}

CATEGORY_ORDER = {
    PASSENGER_CATEGORY.adult: 0,
    PASSENGER_CATEGORY.infant_seat: 1,
    PASSENGER_CATEGORY.child: 2,
    PASSENGER_CATEGORY.infant: 3,
}


def _get_passenger_attr(passenger, field: str, default=None):
    if isinstance(passenger, dict):
        return passenger.get(field, default)
    return getattr(passenger, field, default)


def _format_passenger_name(passenger) -> str:
    if not passenger:
        return ''
    parts = [
        _get_passenger_attr(passenger, 'last_name') or '',
        _get_passenger_attr(passenger, 'first_name') or '',
        _get_passenger_attr(passenger, 'patronymic_name') or '',
    ]
    return ' '.join(part for part in parts if part).strip()


def _build_route_label(route: Route | None) -> str:
    if not route:
        return ''
    origin = None
    destination = None
    if route.origin_airport:
        origin = route.origin_airport.city_name or route.origin_airport.name
    if route.destination_airport:
        destination = route.destination_airport.city_name or route.destination_airport.name
    parts = [p for p in (origin, destination) if p]
    return ' — '.join(parts)


def _extract_pending_filters(payload):
    raw_from = payload.get('from_date')
    raw_to = payload.get('to_date')
    start_dt = parse_date(raw_from, '%Y-%m-%d')
    end_dt = parse_date(raw_to, '%Y-%m-%d')

    if start_dt and end_dt and start_dt > end_dt:
        raise ValueError(PassengerMessages.INVALID_DATE_RANGE)

    return start_dt, end_dt


def _query_pending_ticket_passengers(start_dt=None, end_dt=None):
    """Query BookingFlightPassenger records that need tickets to be issued"""
    query = (
        BookingFlightPassenger.query.options(
            joinedload(BookingFlightPassenger.flight)
            .joinedload(Flight.route)
            .joinedload(Route.origin_airport),
            joinedload(BookingFlightPassenger.flight)
            .joinedload(Flight.route)
            .joinedload(Route.destination_airport),
            joinedload(BookingFlightPassenger.flight)
            .joinedload(Flight.airline),
            joinedload(BookingFlightPassenger.booking_passenger)
            .joinedload(BookingPassenger.booking),
            joinedload(BookingFlightPassenger.booking_passenger)
            .joinedload(BookingPassenger.passenger)
            .joinedload(Passenger.citizenship),
        )
        .join(BookingPassenger, BookingPassenger.id == BookingFlightPassenger.booking_passenger_id)
        .join(Booking, Booking.id == BookingPassenger.booking_id)
        .filter(
            Booking.status == BOOKING_STATUS.completed,
            BookingFlightPassenger.status == BOOKING_FLIGHT_PASSENGER_STATUS.created
        )
    )

    if start_dt:
        query = query.filter(Booking.created_at >= start_dt)

    if end_dt:
        query = query.filter(Booking.created_at <= end_dt)

    return query.order_by(Booking.created_at.desc()).all()


def _get_flight_passenger_counts(flight_id):
    """Get total and unticketed passenger/booking counts for a flight"""
    # Get all records for this flight
    all_records_query = (
        BookingFlightPassenger.query
        .join(BookingPassenger, BookingPassenger.id == BookingFlightPassenger.booking_passenger_id)
        .join(Booking, Booking.id == BookingPassenger.booking_id)
        .filter(
            BookingFlightPassenger.flight_id == flight_id,
            Booking.status == BOOKING_STATUS.completed
        )
    )
    all_records = all_records_query.all()

    total_bookings = set()
    unticketed_bookings = set()
    unticketed_passenger_count = 0

    for record in all_records:
        booking_id = record.booking_passenger.booking_id if record.booking_passenger else None
        if booking_id:
            total_bookings.add(booking_id)
        if record.status == BOOKING_FLIGHT_PASSENGER_STATUS.created:
            unticketed_passenger_count += 1
            if booking_id:
                unticketed_bookings.add(booking_id)

    return {
        'total_passenger_count': len(all_records),
        'unticketed_passenger_count': unticketed_passenger_count,
        'booking_count': len(total_bookings),
        'unticketed_booking_count': len(unticketed_bookings),
    }


def _group_pending_flights(unticketed_records):
    """Group unticketed BookingFlightPassenger records by flight"""
    flights_map = {}
    booking_ids = set()

    for booking_flight_passenger in unticketed_records:
        booking_passenger = booking_flight_passenger.booking_passenger
        passenger = get_booking_passenger_details(booking_passenger)
        booking = booking_passenger.booking if booking_passenger else None
        flight = booking_flight_passenger.flight

        if not (booking and passenger and flight):
            continue

        if booking.id:
            booking_ids.add(booking.id)

        flight_entry = flights_map.get(flight.id)
        if not flight_entry:
            departure_dt = combine_date_time(
                flight.scheduled_departure, flight.scheduled_departure_time
            )
            flight_entry = {
                'id': flight.id,
                'flight_number': flight.airline_flight_number,
                'scheduled_departure': departure_dt.isoformat(),
                'route': _build_route_label(flight.route),
                'airline_name': flight.airline.name,
                'unticketed_passenger_count': 0,
                'total_passenger_count': 0,
                'booking_count': 0,
                'unticketed_booking_count': 0,
                '_bookings': set(),
                '_unticketed_bookings': set(),
                '_departure_dt': departure_dt or flight.scheduled_departure or datetime.min,
            }
            flights_map[flight.id] = flight_entry

        flight_entry['unticketed_passenger_count'] += 1
        flight_entry['_unticketed_bookings'].add(booking.id)

    flights = list(flights_map.values())
    for entry in flights:
        counts = _get_flight_passenger_counts(entry['id'])
        entry['total_passenger_count'] = counts['total_passenger_count']
        entry['booking_count'] = counts['booking_count']
        entry['unticketed_booking_count'] = len(
            entry.pop('_unticketed_bookings', set())
        )
        entry.pop('_bookings', None)

    # Sort by departure date descending
    flights.sort(
        key=lambda item: item.pop('_departure_dt', datetime.min),
        reverse=True,
    )

    summary = {
        'flight_count': len(flights),
        'unticketed_passenger_count': len(unticketed_records),
        'booking_count': len(booking_ids),
    }

    return flights, summary


def _fetch_booking_flights(flight_id: int):
    return (
        BookingFlight.query.options(
            joinedload(BookingFlight.flight_tariff).joinedload(
                FlightTariff.tariff
            ),
            joinedload(BookingFlight.booking),
        )
        .join(FlightTariff, FlightTariff.id == BookingFlight.flight_tariff_id)
        .filter(FlightTariff.flight_id == flight_id)
        .all()
    )


def _normalize_passengers_list(booking, allowed_booking_passenger_ids):
    allowed_ids = (
        set(allowed_booking_passenger_ids)
        if allowed_booking_passenger_ids is not None
        else None
    )
    passengers = list(booking.booking_passengers)
    if allowed_ids is not None:
        passengers = [
            bp for bp in passengers if bp.id in allowed_ids
        ]
    passengers.sort(key=lambda bp: CATEGORY_ORDER.get(bp.category, 0))
    return passengers


def _update_booking_flight_passenger_statuses(
    records,
    new_status: BOOKING_FLIGHT_PASSENGER_STATUS,
    commit: bool = True
):
    """Update status for multiple BookingFlightPassenger records"""
    if not records:
        return

    session = db.session
    for record in records:
        BookingFlightPassenger.update(
            record.id,
            session=session,
            status=new_status
        )

    if commit:
        session.commit()


def _create_flight_passenger_workbook(flight, booking_flights, allowed_booking_passenger_ids=None):
    headers = [
        '№',
        'Фамилия, Имя',
        'Пол',
        'Дата рождения',
        '№ паспорта',
        'Класс',
        'Гражданство',
        'Срок действия для иностранного паспорта',
        'Количество мест',
        'Ребенок пассажира',
        'SSR',
        'Группа',
        'Телефон',
        'E-mail',
    ]

    wb = Workbook()
    ws = wb.add_sheet('Пассажиры')

    text_style = XFStyle()
    text_style.num_format_str = '@'

    bold_style = XFStyle()
    bold_style.num_format_str = '@'
    bold_font = Font()
    bold_font.bold = True
    bold_style.font = bold_font

    col_widths = [3] * len(headers)

    ws.write(0, 0, 'Рейс:', bold_style)
    ws.write(0, 1, flight.airline_flight_number, text_style)
    ws.write(1, 0, 'Дата рейса:', bold_style)
    ws.write(1, 1, format_date(flight.scheduled_departure), text_style)
    route = flight.route
    origin = route.origin_airport.city_name
    dest = route.destination_airport.city_name
    ws.write(2, 0, 'Маршрут:', bold_style)
    ws.write(2, 1, f'{origin} - {dest}', text_style)

    for col, header in enumerate(headers):
        ws.write(7, col, header, bold_style)
        col_widths[col] = max(col_widths[col], len(str(header)))

    row = 8
    counter = 1

    for bf in booking_flights:
        booking = bf.booking
        passengers = _normalize_passengers_list(
            booking, allowed_booking_passenger_ids)
        if not passengers:
            continue

        adult_passenger_idx = next(
            (
                i for i, bp in enumerate(passengers, start=counter)
                if bp.category == PASSENGER_CATEGORY.adult
            ), None
        )
        for bp in passengers:
            p = get_booking_passenger_details(bp)

            # Column 0: Counter
            value = str(counter)
            ws.write(row, 0, value, text_style)
            col_widths[0] = max(col_widths[0], len(value))

            # Column 1: Full name
            value = _format_passenger_name(p)
            ws.write(row, 1, value, text_style)
            col_widths[1] = max(col_widths[1], len(value))

            # Column 2: Gender
            gender_val = _get_passenger_attr(p, 'gender')
            gender_key = gender_val.value if hasattr(gender_val, 'value') else gender_val
            value = GENDER_LABELS.get(gender_key, '') if gender_key else ''
            ws.write(row, 2, value, text_style)
            col_widths[2] = max(col_widths[2], len(str(value)))

            # Column 3: Birth date
            birth_date = _get_passenger_attr(p, 'birth_date')
            value = format_date(birth_date) if birth_date else ''
            ws.write(row, 3, value, text_style)
            col_widths[3] = max(col_widths[3], len(str(value)))

            # Column 4: Document number
            value = _get_passenger_attr(p, 'document_number') or ''
            ws.write(row, 4, value, text_style)
            col_widths[4] = max(col_widths[4], len(str(value)))

            # Column 5: Seat class
            tariff = bf.flight_tariff.tariff if bf.flight_tariff else None
            value = (
                SEAT_CLASS_CODES.get(tariff.seat_class, '')
                if tariff and tariff.seat_class
                else ''
            )
            ws.write(row, 5, value, text_style)
            col_widths[5] = max(col_widths[5], len(str(value)))

            # Column 6: Citizenship
            citizenship = _get_passenger_attr(p, 'citizenship') or {}
            if isinstance(citizenship, dict):
                value = citizenship.get('code_a2') or citizenship.get('code_a3') or ''
            else:
                value = getattr(citizenship, 'code_a2', '') or getattr(citizenship, 'code_a3', '')
            ws.write(row, 6, value, text_style)
            col_widths[6] = max(col_widths[6], len(str(value)))

            # Column 7: Document expiry
            expiry_date = _get_passenger_attr(p, 'document_expiry_date')
            value = format_date(expiry_date) if expiry_date else ''
            ws.write(row, 7, value, text_style)
            col_widths[7] = max(col_widths[7], len(str(value)))

            # Column 8: Seat count
            value = 1 if bp.category == PASSENGER_CATEGORY.infant_seat else ''
            ws.write(row, 8, value, text_style)
            col_widths[8] = max(col_widths[8], len(str(value)))

            # Column 9: Child of passenger
            value = adult_passenger_idx if bp.category in [
                PASSENGER_CATEGORY.child, PASSENGER_CATEGORY.infant, PASSENGER_CATEGORY.infant_seat
            ] else ''
            ws.write(row, 9, value, text_style)
            col_widths[9] = max(col_widths[9], len(str(value)))

            # Column 10: SSR
            ws.write(row, 10, '', text_style)

            # Column 11: Group
            ws.write(row, 11, booking.booking_number, text_style)

            # Column 12: Phone
            value = booking.phone_number or ''
            ws.write(row, 12, value, text_style)
            col_widths[12] = max(col_widths[12], len(str(value)))

            # Column 13: Email
            value = booking.email_address or ''
            ws.write(row, 13, value, text_style)
            col_widths[13] = max(col_widths[13], len(str(value)))

            row += 1
            counter += 1

    # Adjust column widths
    for col, width in enumerate(col_widths):
        ws.col(col).width = min((width + 10) * 256, 65535)

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output


@admin_required
def export_pending_ticket_passengers_by_flight(current_user):
    flight_id = request.args.get('flight_id', type=int)
    if not flight_id:
        return jsonify({'message': PassengerMessages.FLIGHT_REQUIRED}), 400

    flight = Flight.get_or_404(flight_id)
    booking_flights = _fetch_booking_flights(flight.id)

    workbook = _create_flight_passenger_workbook(flight, booking_flights)

    filename = FLIGHT_PASSENGERS_EXPORT_FILENAME_TEMPLATE.format(
        flight_number=flight.airline_flight_number,
        date=format_date(flight.scheduled_departure),
    )

    return send_file(
        workbook,
        as_attachment=True,
        download_name=filename,
        mimetype='application/vnd.ms-excel',
    ), 200


@admin_required
def get_pending_ticket_passengers_routes(current_user):
    routes = Route.query.join(Route.flights).distinct().all()
    data = [
        {
            'id': r.id,
            'name': f'{r.origin_airport.city_name} — {r.destination_airport.city_name}',
        }
        for r in routes
    ]
    return jsonify({'data': data}), 200


@admin_required
def get_pending_ticket_passengers_flights_by_route(current_user, route_id):
    flights = (
        Flight.query.options(joinedload(Flight.airline))
        .filter(Flight.route_id == route_id)
        .order_by(Flight.scheduled_departure)
        .all()
    )

    data = []
    for f in flights:
        counts = _get_flight_passenger_counts(f.id)

        if counts['total_passenger_count'] <= 0:
            continue

        data.append({
            'id': f.id,
            'airline_flight_number': f.airline_flight_number,
            'scheduled_departure': f.scheduled_departure.isoformat()
            if f.scheduled_departure
            else None,
            'airline': {
                'id': f.airline.id if f.airline else None,
                'name': f.airline.name if f.airline else '',
                'iata_code': f.airline.iata_code if f.airline else '',
            },
            **counts,
        })

    return jsonify({'data': data}), 200


@admin_required
def get_pending_ticket_passengers_flights(current_user):
    params = request.args.to_dict() if request.args else {}
    try:
        start_dt, end_dt = _extract_pending_filters(params)
    except (ValueError, TypeError):
        return jsonify({'message': PassengerMessages.INVALID_DATE_RANGE}), 400

    unticketed_records = _query_pending_ticket_passengers(start_dt, end_dt)
    flights, summary = _group_pending_flights(unticketed_records)

    return jsonify({'data': {'flights': flights, 'summary': summary}}), 200


@admin_required
def export_pending_ticket_passengers(current_user):
    payload = request.get_json(silent=True) or {}
    try:
        start_dt, end_dt = _extract_pending_filters(payload)
    except (ValueError, TypeError):
        return jsonify({'message': PassengerMessages.INVALID_DATE_RANGE}), 400

    # Get selected flight IDs from the payload (optional)
    selected_flight_ids = payload.get('flight_ids', [])
    if selected_flight_ids and not isinstance(selected_flight_ids, list):
        return jsonify({'message': PassengerMessages.INVALID_FLIGHT_IDS}), 400

    unticketed_records = _query_pending_ticket_passengers(start_dt, end_dt)
    if not unticketed_records:
        return jsonify({'message': PassengerMessages.NO_PENDING_PASSENGERS}), 400

    records_by_flight = defaultdict(list)
    for record in unticketed_records:
        if record.flight_id:
            records_by_flight[record.flight_id].append(record)

    # Filter by selected flight IDs if provided
    if selected_flight_ids:
        selected_ids_set = set(selected_flight_ids)
        records_by_flight = {
            flight_id: flight_records
            for flight_id, flight_records in records_by_flight.items()
            if flight_id in selected_ids_set
        }

    if not records_by_flight:
        return jsonify({'message': PassengerMessages.NO_PENDING_PASSENGERS}), 400

    zip_buffer = BytesIO()
    files_added = 0
    records_to_mark = []

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as archive:
        for flight_id, flight_records in records_by_flight.items():
            allowed_ids = {
                record.booking_passenger_id
                for record in flight_records
                if record.booking_passenger_id
            }

            if not allowed_ids:
                continue

            initial_flight = flight_records[0].flight if flight_records else None
            flight = initial_flight or Flight.get_or_404(flight_id)
            booking_flights = _fetch_booking_flights(flight.id)
            workbook = _create_flight_passenger_workbook(
                flight, booking_flights, allowed_ids
            )
            filename = FLIGHT_PASSENGERS_EXPORT_FILENAME_TEMPLATE.format(
                flight_number=flight.airline_flight_number,
                date=format_date(flight.scheduled_departure),
            )

            archive.writestr(filename, workbook.getvalue())

            files_added += 1
            records_to_mark.extend(flight_records)

    if files_added == 0:
        return jsonify({'message': PassengerMessages.NO_PENDING_PASSENGERS}), 400

    _update_booking_flight_passenger_statuses(
        records_to_mark,
        BOOKING_FLIGHT_PASSENGER_STATUS.ticket_in_progress
    )

    filename = PENDING_PASSENGERS_EXPORT_FILENAME_TEMPLATE.format(
        timestamp=format_datetime(datetime.now(), '%Y%m%d_%H%M%S')
    )

    zip_buffer.seek(0)

    return send_file(
        zip_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/zip',
    ), 200
