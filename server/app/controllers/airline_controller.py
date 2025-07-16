from flask import request, jsonify, send_file

from app.models.airline import Airline
from app.models.country import Country
from app.middlewares.auth_middleware import admin_required
from app.utils.xlsx_uploader import is_xlsx_file, create_xlsx


@admin_required
def get_airlines(current_user):
    airlines = Airline.get_all()
    return jsonify([a.to_dict() for a in airlines])


@admin_required
def get_airline(current_user, airline_id):
    airline = Airline.get_by_id(airline_id)
    if airline:
        return jsonify(airline.to_dict()), 200
    return jsonify({'message': 'Airline not found'}), 404


@admin_required
def create_airline(current_user):
    body = request.json
    country_id = body.get('country_id')
    if country_id is not None and not Country.get_by_id(country_id):
        return jsonify({'message': 'Country not found'}), 404
    airline = Airline.create(**body)
    return jsonify(airline.to_dict()), 201


@admin_required
def update_airline(current_user, airline_id):
    body = request.json
    country_id = body.get('country_id')
    if country_id is not None and not Country.get_by_id(country_id):
        return jsonify({'message': 'Country not found'}), 404
    updated = Airline.update(airline_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Airline not found'}), 404


@admin_required
def delete_airline(current_user, airline_id):
    deleted = Airline.delete(airline_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Airline not found'}), 404


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
