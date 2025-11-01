from io import BytesIO

from flask import request, jsonify, send_file
from xlwt import Workbook, XFStyle, Font
from sqlalchemy.orm import joinedload

from app.constants.files import FLIGHT_PASSENGERS_EXPORT_FILENAME_TEMPLATE
from app.constants.messages import PassengerMessages
from app.constants.branding import GENDER_LABELS
from app.models.flight import Flight
from app.models.booking_flight import BookingFlight
from app.models.flight_tariff import FlightTariff
from app.models.route import Route
from app.utils.datetime import format_date
from app.middlewares.auth_middleware import admin_required
from app.utils.enum import SEAT_CLASS, PASSENGER_CATEGORY


@admin_required
def get_flight_passenger_export(current_user):
    flight_id = request.args.get('flight_id', type=int)
    if not flight_id:
        return jsonify({'message': PassengerMessages.FLIGHT_REQUIRED}), 400

    flight = Flight.get_or_404(flight_id)

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

    seat_class_code = {
        SEAT_CLASS.economy: 'Y',
        SEAT_CLASS.business: 'C',
    }

    category_order = {
        PASSENGER_CATEGORY.adult: 0,
        PASSENGER_CATEGORY.infant_seat: 1,
        PASSENGER_CATEGORY.child: 2,
        PASSENGER_CATEGORY.infant: 3,
    }

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

    booking_flights = (
        BookingFlight.query.join(
            FlightTariff, FlightTariff.id == BookingFlight.flight_tariff_id
        )
        .filter(FlightTariff.flight_id == flight_id)
        .all()
    )
    row = 8
    counter = 1

    for bf in booking_flights:
        booking = bf.booking
        passengers = sorted(
            booking.booking_passengers,
            key=lambda bp: category_order.get(bp.category, 0),
        )
        adult_passenger_idx = next(
            (
                i for i, bp in enumerate(passengers, start=counter)
                if bp.category == PASSENGER_CATEGORY.adult
            ), None
        )
        for bp in passengers:
            p = bp.passenger

            # Column 0: Counter
            value = str(counter)
            ws.write(row, 0, value, text_style)
            col_widths[0] = max(col_widths[0], len(value))

            # Column 1: Full name
            value = f'{p.last_name} {p.first_name} {p.patronymic_name if p.patronymic_name else ""}'.strip()
            ws.write(row, 1, value, text_style)
            col_widths[1] = max(col_widths[1], len(value))

            # Column 2: Gender
            value = GENDER_LABELS[p.gender.value]
            ws.write(row, 2, value, text_style)
            col_widths[2] = max(col_widths[2], len(str(value)))

            # Column 3: Birth date
            value = format_date(p.birth_date)
            ws.write(row, 3, value, text_style)
            col_widths[3] = max(col_widths[3], len(str(value)))

            # Column 4: Document number
            value = p.document_number
            ws.write(row, 4, value, text_style)
            col_widths[4] = max(col_widths[4], len(str(value)))

            # Column 5: Seat class
            tariff = bf.flight_tariff.tariff if bf.flight_tariff else None
            value = seat_class_code.get(tariff.seat_class, '') if tariff and tariff.seat_class else ''
            ws.write(row, 5, value, text_style)
            col_widths[5] = max(col_widths[5], len(str(value)))

            # Column 6: Citizenship
            value = p.citizenship.code_a2
            ws.write(row, 6, value, text_style)
            col_widths[6] = max(col_widths[6], len(str(value)))

            # Column 7: Document expiry
            value = format_date(p.document_expiry_date)
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

            # Column 10-11: SSR, Group
            ws.write(row, 10, '', text_style)
            ws.write(row, 11, '', text_style)

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

    filename = FLIGHT_PASSENGERS_EXPORT_FILENAME_TEMPLATE.format(
        flight_number=flight.airline_flight_number,
        date=format_date(flight.scheduled_departure),
    )

    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype='application/vnd.ms-excel',
    ), 200


@admin_required
def get_passenger_export_routes(current_user):
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
def get_passenger_export_flights(current_user, route_id):
    flights = (
        Flight.query.options(joinedload(Flight.airline))
        .filter_by(route_id=route_id)
        .order_by(Flight.scheduled_departure)
        .all()
    )
    data = [
        {
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
            'airline_name': f.airline.name if f.airline else '',
        }
        for f in flights
    ]
    return jsonify({'data': data}), 200
