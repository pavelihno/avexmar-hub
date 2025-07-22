from flask import request, jsonify, send_file

from app.models.airline import Airline
from app.models.country import Country
from app.models._base_model import ModelValidationError, NotFoundError
from app.middlewares.auth_middleware import admin_required
from app.utils.xlsx import is_xlsx_file, create_xlsx


@admin_required
def get_airlines(current_user):
    airlines = Airline.get_all()
    return jsonify([a.to_dict() for a in airlines])


@admin_required
def get_airline(current_user, airline_id):
    try:
        airline = Airline.get_or_404(airline_id)
        return jsonify(airline.to_dict()), 200
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def create_airline(current_user):
    body = request.json
    try:
        airline = Airline.create(**body)
        return jsonify(airline.to_dict()), 201
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def update_airline(current_user, airline_id):
    body = request.json
    try:
        updated = Airline.update(airline_id, **body)
        return jsonify(updated.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def delete_airline(current_user, airline_id):
    try:
        deleted = Airline.delete_or_404(airline_id)
        return jsonify(deleted.to_dict())
    except ModelValidationError as e:
        return jsonify({'errors': e.errors}), 400
    except NotFoundError as e:
        return jsonify({'message': str(e)}), 404


@admin_required
def get_airline_template(current_user):
    xlsx = Airline.get_xlsx_template()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name='airlines_template.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


@admin_required
def upload_airline(current_user):
    file = request.files.get('file')
    if not file:
        return jsonify({'message': 'No file provided'}), 400
    if not is_xlsx_file(file):
        return jsonify({'message': 'Invalid file type'}), 400
    try:
        airlines, error_rows = Airline.upload_from_file(file)
        if error_rows:
            error_xlsx = create_xlsx(Airline.upload_fields, error_rows)
            error_xlsx.seek(0)
            return send_file(
                error_xlsx,
                as_attachment=True,
                download_name='upload_errors.xlsx',
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ), 201

        return jsonify({'message': 'Airlines created successfully'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500
