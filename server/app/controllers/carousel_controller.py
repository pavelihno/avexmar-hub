from flask import jsonify, request

from app.constants.messages import FileMessages
from app.models.carousel_slide import CarouselSlide
from app.middlewares.auth_middleware import admin_required
from app.utils.storage import ImageManager


def get_carousel_slides():
    slides = CarouselSlide.get_all()
    return jsonify([slide.to_dict(return_children=True) for slide in slides]), 200

def get_carousel_slide(slide_id):
    slide = CarouselSlide.get_or_404(slide_id)
    return jsonify(slide.to_dict(return_children=True)), 200

@admin_required
def create_carousel_slide(current_user):
    body = request.json
    slide = CarouselSlide.create(commit=True, **body)
    return jsonify(slide.to_dict()), 201


@admin_required
def update_carousel_slide(current_user, slide_id):
    body = request.json
    updated = CarouselSlide.update(slide_id, commit=True, **body)
    return jsonify(updated.to_dict()), 200


@admin_required
def delete_carousel_slide(current_user, slide_id):
    deleted = CarouselSlide.delete(slide_id, commit=True)
    return jsonify(deleted), 200


@admin_required
def upload_carousel_slide_image(current_user, slide_id):
    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'message': FileMessages.FILE_REQUIRED}), 400

    image_manager = ImageManager()

    try:
        image_path, image_filename = image_manager.save_file(file, 'carousel')
    except Exception as exc:
        return jsonify({'message': str(exc)}), 500

    updated = CarouselSlide.update(
        slide_id, commit=True, 
        image_path=image_path, image_filename=image_filename
    )

    return jsonify(updated.to_dict()), 201
