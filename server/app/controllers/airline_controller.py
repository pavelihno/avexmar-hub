from flask import request, jsonify, send_file

from app.constants.files import AIRLINES_TEMPLATE_FILENAME, AIRLINES_DATA_FILENAME, UPLOAD_ERRORS_FILENAME
from app.constants.messages import FileMessages
from app.models.airline import Airline

from app.middlewares.auth_middleware import admin_required
from app.utils.xlsx import is_xlsx_file


def get_airlines():
    airlines = Airline.get_all()
    return jsonify([a.to_dict() for a in airlines]), 200


def get_airline(airline_id):
    airline = Airline.get_or_404(airline_id)
    return jsonify(airline.to_dict()), 200


@admin_required
def create_airline(current_user):
    body = request.json
    airline = Airline.create(commit=True, **body)
    return jsonify(airline.to_dict()), 201


@admin_required
def update_airline(current_user, airline_id):
    body = request.json
    updated = Airline.update(airline_id, commit=True, **body)
    return jsonify(updated.to_dict()), 200


@admin_required
def delete_airline(current_user, airline_id):
    deleted = Airline.delete_or_404(airline_id, commit=True)
    return jsonify(deleted), 200


@admin_required
def get_airline_template(current_user):
    xlsx = Airline.get_upload_xlsx_template()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name=AIRLINES_TEMPLATE_FILENAME,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ), 200


@admin_required
def download_airlines(current_user):
    xlsx = Airline.get_upload_xlsx_data()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name=AIRLINES_DATA_FILENAME,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ), 200


@admin_required
def upload_airline(current_user):
    file = request.files.get('file')
    if not file:
        return jsonify({'message': FileMessages.NO_FILE_PROVIDED}), 400
    if not is_xlsx_file(file):
        return jsonify({'message': FileMessages.INVALID_FILE_TYPE}), 400
    airlines, error_rows = Airline.upload_from_file(file)
    if error_rows:
        error_xlsx = Airline.get_upload_xlsx_report(error_rows)
        error_xlsx.seek(0)
        return send_file(
            error_xlsx,
            as_attachment=True,
            download_name=UPLOAD_ERRORS_FILENAME,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ), 201

    return jsonify({'message': FileMessages.IMPORT_COMPLETED}), 201
