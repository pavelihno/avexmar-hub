from flask import request, jsonify, send_file

from app.constants.messages import FileMessages
from app.models.flight import Flight
from app.middlewares.auth_middleware import admin_required
from app.utils.xlsx import create_xlsx, is_xlsx_file


def get_flights():
    flights = Flight.get_all()
    return jsonify([flight.to_dict() for flight in flights])


def get_flight(flight_id):
    flight = Flight.get_or_404(flight_id)
    return jsonify(flight.to_dict()), 200


@admin_required
def create_flight(current_user):
    body = request.json
    flight = Flight.create(commit=True, **body)
    return jsonify(flight.to_dict()), 201


@admin_required
def update_flight(current_user, flight_id):
    body = request.json
    updated = Flight.update(flight_id, commit=True, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_flight(current_user, flight_id):
    deleted = Flight.delete_or_404(flight_id, commit=True)
    return jsonify(deleted)


@admin_required
def get_flight_template(current_user):
    xlsx = Flight.get_xlsx_template()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name='flights_template.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


@admin_required
def upload_flight(current_user):
    file = request.files.get('file')
    if not file:
        return jsonify({'message': FileMessages.NO_FILE_PROVIDED}), 400
    if not is_xlsx_file(file):
        return jsonify({'message': FileMessages.INVALID_FILE_TYPE}), 400

    flights, error_rows = Flight.upload_from_file(file)
    if error_rows:
        error_xlsx = create_xlsx(
            Flight.get_upload_fields(), error_rows,
            Flight.get_upload_date_fields(), Flight.get_upload_time_fields()
        )
        error_xlsx.seek(0)
        return send_file(
            error_xlsx,
            as_attachment=True,
            download_name='upload_errors.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ), 201

    return jsonify({'message': FileMessages.IMPORT_COMPLETED}), 201
