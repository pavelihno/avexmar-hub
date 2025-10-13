from io import BytesIO

from flask import request, jsonify, send_file
from xlwt import Workbook, XFStyle

from app.constants.messages import PassengerMessages
from app.models.flight import Flight
from app.models.booking_flight import BookingFlight
from app.models.route import Route
from app.utils.datetime import format_date
from app.middlewares.auth_middleware import admin_required
from app.utils.enum import SEAT_CLASS, PASSENGER_CATEGORY

@admin_required
def get_flight_passenger_export(current_user):
    flight_id = request.args.get('flight_id', type=int)
    flight_date = request.args.get('date')
    if not flight_id or not flight_date:
        return jsonify({'message': PassengerMessages.FLIGHT_AND_DATE_REQUIRED}), 400

    flight = Flight.get_or_404(flight_id)
    if format_date(flight.scheduled_departure) != format_date(flight_date):
        return jsonify({'message': PassengerMessages.FLIGHT_DATE_MISMATCH}), 400

    wb = Workbook()
    ws = wb.add_sheet('Passengers')

    text_style = XFStyle()
    text_style.num_format_str = '@'

    ws.write(0, 0, 'Рейс:', text_style)
    ws.write(0, 1, flight.airline_flight_number, text_style)
    ws.write(1, 0, 'Дата рейса:', text_style)
    ws.write(1, 1, format_date(flight.scheduled_departure), text_style)
    route = flight.route
    origin = route.origin_airport.city_name
    dest = route.destination_airport.city_name
    ws.write(2, 0, 'Маршрут:', text_style)
    ws.write(2, 1, f'{origin} - {dest}', text_style)

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

    for col, header in enumerate(headers):
        ws.write(7, col, header, text_style)

    booking_flights = BookingFlight.query.filter_by(flight_id=flight_id).all()
    row = 8
    counter = 1
    category_order = {
        PASSENGER_CATEGORY.adult: 0,
        PASSENGER_CATEGORY.infant_seat: 1,
        PASSENGER_CATEGORY.child: 2,
        PASSENGER_CATEGORY.infant: 3,
    }

    for bf in booking_flights:
        booking = bf.booking
        passengers = sorted(
            booking.booking_passengers,
            key=lambda bp: category_order.get(bp.category, 0),
        )
        for bp in passengers:
            p = bp.passenger
            ws.write(row, 0, str(counter), text_style)
            ws.write(row, 1, f'{p.last_name} {p.first_name}', text_style)
            ws.write(row, 2, p.gender.value, text_style)
            ws.write(row, 3, format_date(p.birth_date), text_style)
            ws.write(row, 4, (p.document_number or '').replace(' ', ''), text_style)
            seat_class = 'Y' if bf.tariff.seat_class == SEAT_CLASS.economy else 'C'
            ws.write(row, 5, seat_class, text_style)
            citizenship = (p.citizenship.code_a2 if p.citizenship else '')
            if not citizenship or (
                getattr(p.citizenship, 'name', '').lower() == 'russia'
            ):
                citizenship = 'RU'
            ws.write(row, 6, citizenship, text_style)
            ws.write(row, 7, format_date(p.document_expiry_date), text_style)
            seat_count = '1' if bp.category == PASSENGER_CATEGORY.infant_seat else ''
            ws.write(row, 8, seat_count, text_style)
            ws.write(row, 9, '', text_style)
            ws.write(row, 10, '', text_style)
            ws.write(row, 11, '', text_style)
            ws.write(row, 12, booking.phone_number or '', text_style)
            ws.write(row, 13, booking.email_address or '', text_style)
            row += 1
            counter += 1

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return send_file(
        output,
        as_attachment=True,
        download_name='flight_passengers.xls',
        mimetype='application/vnd.ms-excel',
    )


@admin_required
def get_passenger_export_routes(current_user):
    routes = Route.query.join(Route.flights).distinct().all()
    data = [
        {
            'id': r.id,
            'name': f'{r.origin_airport.city_name} - {r.destination_airport.city_name}',
        }
        for r in routes
    ]
    return jsonify({'data': data})


@admin_required
def get_passenger_export_flights(current_user, route_id):
    flights = (
        Flight.query.filter_by(route_id=route_id)
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
        }
        for f in flights
    ]
    return jsonify({'data': data})
