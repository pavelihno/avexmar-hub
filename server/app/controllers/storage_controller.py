from flask import send_from_directory, jsonify

from app.utils.storage import ImageManager


def serve_image(subfolder_name: str, filename: str):
    if not subfolder_name or not filename:
        return jsonify({'message': 'Image not found'}), 404

    image_manager = ImageManager()

    try:
        directory, file_name = image_manager.get_file_path(filename, subfolder_name)
        return send_from_directory(directory, file_name, as_attachment=False)
    except ValueError:
        return jsonify({'message': 'Image not found'}), 404
