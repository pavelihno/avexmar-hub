from flask import request, jsonify

from app.models.tariff import Tariff
from app.models.fee import Fee
from app.models.tariff_fee import TariffFee
from app.middlewares.auth_middleware import admin_required
from app.database import db


def get_tariffs():
    tariffs = Tariff.get_all()
    return jsonify([t.to_dict() for t in tariffs]), 200


def get_tariff(tariff_id):
    tariff = Tariff.get_or_404(tariff_id)
    return jsonify(tariff.to_dict()), 200


def _manage_tariff_fees(tariff_id, fee_ids, session):
    """Manage the many-to-many relationship between tariff and fees"""
    session.query(TariffFee).filter_by(tariff_id=tariff_id).delete()

    if fee_ids and isinstance(fee_ids, list):
        for fee_id in fee_ids:
            if fee_id:
                Fee.get_or_404(fee_id, session)
                TariffFee.create(
                    session,
                    tariff_id=tariff_id,
                    fee_id=fee_id,
                    commit=False
                )


@admin_required
def create_tariff(current_user):
    body = request.json
    fee_ids = body.pop('fee_ids', None)

    tariff = Tariff.create(commit=False, **body)

    if fee_ids is not None:
        _manage_tariff_fees(tariff.id, fee_ids, db.session)

    db.session.commit()
    return jsonify(tariff.to_dict()), 201


@admin_required
def update_tariff(current_user, tariff_id):
    body = request.json
    fee_ids = body.pop('fee_ids', None)

    updated = Tariff.update(tariff_id, commit=False, **body)

    if fee_ids is not None:
        _manage_tariff_fees(tariff_id, fee_ids, db.session)

    db.session.commit()
    return jsonify(updated.to_dict()), 200


@admin_required
def delete_tariff(current_user, tariff_id):
    deleted = Tariff.delete_or_404(tariff_id, commit=True)
    return jsonify(deleted), 200
