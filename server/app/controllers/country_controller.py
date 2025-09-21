from flask import request, jsonify, send_file

from app.models.country import Country
from app.middlewares.auth_middleware import admin_required
from app.utils.xlsx import create_xlsx, is_xlsx_file


def get_countries():
    countries = Country.get_all()
    return jsonify([c.to_dict() for c in countries])


def get_country(country_id):
    country = Country.get_or_404(country_id)
    return jsonify(country.to_dict()), 200


@admin_required
def create_country(current_user):
    body = request.json
    country = Country.create(commit=True, **body)
    return jsonify(country.to_dict()), 201


@admin_required
def update_country(current_user, country_id):
    body = request.json
    updated = Country.update(country_id, commit=True, **body)
    return jsonify(updated.to_dict())


@admin_required
def delete_country(current_user, country_id):
    deleted = Country.delete_or_404(country_id, commit=True)
    return jsonify(deleted)


@admin_required
def get_country_template(current_user):
    xlsx = Country.get_xlsx_template()
    xlsx.seek(0)
    return send_file(
        xlsx,
        as_attachment=True,
        download_name='countries_template.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


@admin_required
def upload_country(current_user):
    file = request.files.get('file')
    if not file:
        return jsonify({'message': 'No file provided'}), 400
    if not is_xlsx_file(file):
        return jsonify({'message': 'Invalid file type'}), 400
    countries, error_rows = Country.upload_from_file(file)

    if error_rows:
        error_xlsx = create_xlsx(Country.upload_fields, error_rows)
        error_xlsx.seek(0)
        return send_file(
            error_xlsx,
            as_attachment=True,
            download_name='upload_errors.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ), 201

    return jsonify({'message': 'Countries created successfully'}), 201
