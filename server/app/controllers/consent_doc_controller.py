from flask import request, jsonify

from app.models.consent import ConsentDoc
from app.middlewares.auth_middleware import admin_required
from app.utils.enum import CONSENT_DOC_TYPE


def get_consent_docs():
    docs = ConsentDoc.get_all()
    return jsonify([doc.to_dict() for doc in docs])


def get_consent_doc(doc_id):
    doc = ConsentDoc.get_or_404(doc_id)
    return jsonify(doc.to_dict()), 200


def get_latest_consent_doc(doc_type):
    try:
        doc_enum = CONSENT_DOC_TYPE(doc_type)
    except ValueError:
        return jsonify({'message': 'invalid type'}), 400

    doc = ConsentDoc.get_latest(doc_enum)

    return jsonify(doc.to_dict()), 200


@admin_required
def create_consent_doc(current_user):
    body = request.json or {}
    doc = ConsentDoc.create(commit=True, **body)
    return jsonify(doc.to_dict()), 201


@admin_required
def update_consent_doc(current_user, doc_id):
    body = request.json or {}
    doc = ConsentDoc.update(doc_id, commit=True, **body)
    return jsonify(doc.to_dict())


@admin_required
def delete_consent_doc(current_user, doc_id):
    deleted = ConsentDoc.delete_or_404(doc_id, commit=True)
    return jsonify(deleted)
