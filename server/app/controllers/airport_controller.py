from flask import request, jsonify, send_file

from app.constants.files import AIRPORTS_TEMPLATE_FILENAME, AIRPORTS_DATA_FILENAME, UPLOAD_ERRORS_FILENAME
from app.constants.messages import FileMessages
from app.models.airport import Airport
from app.middlewares.auth_middleware import admin_required
from app.utils.xlsx import is_xlsx_file


def get_airports():
    airports = Airport.get_all()
    return jsonify([airport.to_dict() for airport in airports]), 200


def get_airport(airport_id):
    airport = Airport.get_or_404(airport_id)
    return jsonify(airport.to_dict()), 200


@admin_required
def create_airport(current_user):
    body = request.json
    airport = Airport.create(commit=True, **body)
    return jsonify(airport.to_dict()), 201


@admin_required
def update_airport(current_user, airport_id):
    body = request.json
    updated = Airport.update(airport_id, commit=True, **body)
    return jsonify(updated.to_dict()), 200


@admin_required
def delete_airport(current_user, airport_id):
    deleted = Airport.delete_or_404(airport_id, commit=True)
    return jsonify(deleted), 200


@admin_required
def get_airport_template(current_user):
    xlsx = Airport.get_upload_xlsx_template()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name=AIRPORTS_TEMPLATE_FILENAME,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ), 200


@admin_required
def download_airports(current_user):
    xlsx = Airport.get_upload_xlsx_data()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name=AIRPORTS_DATA_FILENAME,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ), 200


@admin_required
def upload_airport(current_user):
    file = request.files.get('file')
    if not file:
        return jsonify({'message': FileMessages.NO_FILE_PROVIDED}), 400
    if not is_xlsx_file(file):
        return jsonify({'message': FileMessages.INVALID_FILE_TYPE}), 400
    airports, error_rows = Airport.upload_from_file(file)
    if error_rows:
        error_xlsx = Airport.get_upload_xlsx_report(error_rows)
        error_xlsx.seek(0)
        return send_file(
            error_xlsx,
            as_attachment=True,
            download_name=UPLOAD_ERRORS_FILENAME,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ), 201

    return jsonify({'message': FileMessages.IMPORT_COMPLETED}), 201
