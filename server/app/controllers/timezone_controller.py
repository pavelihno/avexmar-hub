from flask import jsonify, request, send_file
from app.models.timezone import Timezone
from app.middlewares.auth_middleware import admin_required
from app.utils.xlsx import is_xlsx_file, create_xlsx


@admin_required
def get_timezones(current_user):
    timezones = Timezone.get_all()
    return jsonify([tz.to_dict() for tz in timezones])


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
    return jsonify(updated.to_dict())


@admin_required
def delete_timezone(current_user, timezone_id):
    deleted = Timezone.delete_or_404(timezone_id, commit=True)
    return jsonify(deleted)


@admin_required
def get_timezone_template(current_user):
    xlsx = Timezone.get_xlsx_template()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name='timezones_template.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


@admin_required
def upload_timezone(current_user):
    file = request.files.get('file')
    if not file:
        return jsonify({'message': 'No file provided'}), 400
    if not is_xlsx_file(file):
        return jsonify({'message': 'Invalid file type'}), 400
    timezones, error_rows = Timezone.upload_from_file(file)

    if error_rows:
        error_xlsx = create_xlsx(Timezone.upload_fields, error_rows)
        error_xlsx.seek(0)
        return send_file(
            error_xlsx,
            as_attachment=True,
            download_name='upload_errors.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ), 201

    return jsonify({'message': 'Timezones created successfully'}), 201
