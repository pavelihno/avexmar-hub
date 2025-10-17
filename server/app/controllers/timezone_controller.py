from flask import jsonify, request, send_file

from app.constants.files import TIMEZONES_TEMPLATE_FILENAME, UPLOAD_ERRORS_FILENAME
from app.constants.messages import FileMessages
from app.models.timezone import Timezone
from app.middlewares.auth_middleware import admin_required
from app.utils.xlsx import is_xlsx_file


@admin_required
def get_timezones(current_user):
    timezones = Timezone.get_all()
    return jsonify([tz.to_dict() for tz in timezones]), 200


@admin_required
def get_timezone(current_user, timezone_id):
    tz = Timezone.get_or_404(timezone_id)
    return jsonify(tz.to_dict()), 200


@admin_required
def create_timezone(current_user):
    body = request.json
    tz = Timezone.create(commit=True, **body)
    return jsonify(tz.to_dict()), 201


@admin_required
def update_timezone(current_user, timezone_id):
    body = request.json
    updated = Timezone.update(timezone_id, commit=True, **body)
    return jsonify(updated.to_dict()), 200


@admin_required
def delete_timezone(current_user, timezone_id):
    deleted = Timezone.delete_or_404(timezone_id, commit=True)
    return jsonify(deleted), 200


@admin_required
def get_timezone_template(current_user):
    xlsx = Timezone.get_upload_xlsx_template()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name=TIMEZONES_TEMPLATE_FILENAME,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ), 200


@admin_required
def upload_timezone(current_user):
    file = request.files.get('file')
    if not file:
        return jsonify({'message': FileMessages.NO_FILE_PROVIDED}), 400
    if not is_xlsx_file(file):
        return jsonify({'message': FileMessages.INVALID_FILE_TYPE}), 400
    timezones, error_rows = Timezone.upload_from_file(file)

    if error_rows:
        error_xlsx = Timezone.get_upload_xlsx_report(error_rows)
        error_xlsx.seek(0)
        return send_file(
            error_xlsx,
            as_attachment=True,
            download_name=UPLOAD_ERRORS_FILENAME,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ), 201

    return jsonify({'message': FileMessages.IMPORT_COMPLETED}), 201
