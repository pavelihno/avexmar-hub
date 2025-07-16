from flask import request, jsonify, send_file

from app.models.country import Country
from app.middlewares.auth_middleware import admin_required
from app.utils.xlsx_uploader import create_xlsx, is_xlsx_file


@admin_required
def get_countries(current_user):
    countries = Country.get_all()
    return jsonify([c.to_dict() for c in countries])


@admin_required
def get_country(current_user, country_id):
    country = Country.get_by_id(country_id)
    if country:
        return jsonify(country.to_dict()), 200
    return jsonify({'message': 'Country not found'}), 404


@admin_required
def create_country(current_user):
    body = request.json
    country = Country.create(**body)
    return jsonify(country.to_dict()), 201


@admin_required
def update_country(current_user, country_id):
    body = request.json
    updated = Country.update(country_id, **body)
    if updated:
        return jsonify(updated.to_dict())
    return jsonify({'message': 'Country not found'}), 404


@admin_required
def delete_country(current_user, country_id):
    deleted = Country.delete(country_id)
    if deleted:
        return jsonify(deleted.to_dict())
    return jsonify({'message': 'Country not found'}), 404


@admin_required
def get_country_template(current_user):
    xlsx = Country.get_xlsx_template()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name="countries_template.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@admin_required
def upload_country(current_user):
    file = request.files.get('file')
    if not file:
        return jsonify({'message': 'No file provided'}), 400
    if not is_xlsx_file(file):
        return jsonify({'message': 'Invalid file type'}), 400
    try:
        countries, error_rows = Country.upload_from_file(file)

        if error_rows:
            error_xlsx = create_xlsx(Country.upload_fields, error_rows)
            error_xlsx.seek(0)
            return send_file(
                error_xlsx,
                as_attachment=True,
                download_name="upload_errors.xlsx",
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ), 201

        return jsonify({'message': 'Countries created successfully'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500
