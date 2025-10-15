import uuid
from pathlib import Path
from typing import Optional, Tuple

from werkzeug.datastructures import FileStorage

from app.config import Config
from app.constants.messages import FileMessages


class StorageManager:
    def __init__(self):
        self.storage_root = Path(Config.STORAGE_DIR).resolve()
        self.folder_name = ''
        self.allowed_extensions = []

    def _validate_extension(self, filename: str) -> str:
        """Validate file extension and return it without the dot"""
        extension = Path(filename).suffix.lower()
        if self.allowed_extensions and extension not in self.allowed_extensions:
            raise ValueError(FileMessages.INVALID_FILE_TYPE)
        return extension.lstrip('.')

    def _normalize_relative_dir(self, relative_dir: str) -> Path:
        relative = Path(relative_dir or '')
        normalized = Path(
            *[part for part in relative.parts if part not in ('', '.', '..')])
        return normalized

    def save_file(self, file: FileStorage, subfolder_name: Optional[str] = None) -> Tuple[str, str]:
        """Save a file to storage and return (relative_path, filename)"""
        if not file or not file.filename:
            raise ValueError(FileMessages.FILE_REQUIRED)

        extension = self._validate_extension(file.filename)

        # Build target directory path
        if subfolder_name:
            normalized_subfolder = self._normalize_relative_dir(subfolder_name)
            target_dir = self.storage_root / self.folder_name / normalized_subfolder
        else:
            target_dir = self.storage_root / self.folder_name

        # Create directory if it doesn't exist
        target_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename with extension
        unique_name = f'{uuid.uuid4().hex}.{extension}'
        target_path = target_dir / unique_name

        # Save the file
        file.save(str(target_path))

        # Return relative path from storage root and filename
        relative_path = str(target_path.relative_to(self.storage_root))
        return relative_path, unique_name

    def resolve_path(self, relative_path: str) -> Path:
        """Resolve and validate a relative path within storage root"""
        normalized = self._normalize_relative_dir(relative_path)
        full_path = (self.storage_root / normalized).resolve()

        # Security check: ensure the path is within storage_root
        if not str(full_path).startswith(str(self.storage_root)):
            raise ValueError(FileMessages.INVALID_PATH)

        if not full_path.exists():
            raise ValueError(FileMessages.FILE_NOT_FOUND)

        return full_path

    def get_file_url(self, filename: str, subfolder_name: Optional[str] = None) -> str:
        """Build a full URL for a file given its folder, subfolder, and filename"""
        if not filename:
            return ''

        parts = [
            self.folder_name,
            subfolder_name,
            filename
        ] if subfolder_name else [self.folder_name, filename]
        relative_path = '/'.join(part.strip('/') for part in parts if part)

        return f"{Config.STORAGE_URL.rstrip('/')}/{relative_path}"

    def delete_file(self, relative_path: str) -> bool:
        """Delete a file from storage and return success status"""
        try:
            file_path = self.resolve_path(relative_path)
            if file_path.is_file():
                file_path.unlink()
                return True
            return False
        except (ValueError, OSError):
            return False


class ImageManager(StorageManager):
    """Manager for handling images"""

    def __init__(self):
        super().__init__()

        self.allowed_extensions = {'.jpg', '.jpeg', '.png'}
        self.folder_name = 'images'
