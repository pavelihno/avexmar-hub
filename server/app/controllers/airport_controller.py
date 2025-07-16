from flask import request, jsonify, send_file

from app.models.airport import Airport
from app.middlewares.auth_middleware import admin_required
from app.models._base_model import ModelValidationError
from app.utils.xlsx_uploader import is_xlsx_file, create_xlsx


@admin_required
def get_airports(current_user):
    airports = Airport.get_all()
    return jsonify([airport.to_dict() for airport in airports])


@admin_required
def get_airport(current_user, airport_id):
    airport = Airport.get_by_id(airport_id)
    if airport:
        return jsonify(airport.to_dict()), 200
    return jsonify({'message': 'Airport not found'}), 404


@admin_required
def create_airport(current_user):
    body = request.json
    try:
        airport = Airport.create(**body)
        return jsonify(airport.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def update_airport(current_user, airport_id):
    body = request.json
    try:
        updated = Airport.update(airport_id, **body)
        if updated:
            return jsonify(updated.to_dict())
        return jsonify({'message': 'Airport not found'}), 404
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400


@admin_required
def delete_airport(current_user, airport_id):
    deleted = Airport.delete(airport_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Airport not found'}), 404


@admin_required
def get_airport_template(current_user):
    xlsx = Airport.get_xlsx_template()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name='airports_template.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


@admin_required
def upload_airport(current_user):
    file = request.files.get('file')
    if not file:
        return jsonify({'message': 'No file provided'}), 400
    if not is_xlsx_file(file):
        return jsonify({'message': 'Invalid file type'}), 400
    try:
        airports, error_rows = Airport.upload_from_file(file)
        if error_rows:
            error_xlsx = create_xlsx(Airport.upload_fields, error_rows)
            error_xlsx.seek(0)
            return send_file(
                error_xlsx,
                as_attachment=True,
                download_name='upload_errors.xlsx',
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ), 201

        return jsonify({'message': 'Airports created successfully'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500
