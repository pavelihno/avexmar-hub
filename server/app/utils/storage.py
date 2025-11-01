import uuid

from pathlib import Path
from typing import BinaryIO, Optional, Tuple, Union

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
            *[part for part in relative.parts if part not in ('', '.', '..')]
        )
        return normalized

    def _build_relative_path(self, filename: str, subfolder_name: Optional[str] = None) -> str:
        """Build relative path from folder, subfolder, and filename"""
        if subfolder_name:
            normalized_subfolder = self._normalize_relative_dir(subfolder_name)
            return str(Path(self.folder_name) / normalized_subfolder / filename)
        return str(Path(self.folder_name) / filename)

    def _get_target_directory(self, subfolder_name: Optional[str] = None) -> Path:
        """Build and create target directory path"""
        if subfolder_name:
            normalized_subfolder = self._normalize_relative_dir(subfolder_name)
            target_dir = self.storage_root / self.folder_name / normalized_subfolder
        else:
            target_dir = self.storage_root / self.folder_name

        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir

    def _generate_filename(self, extension: str, filename: Optional[str] = None) -> str:
        """Generate a unique filename or use provided filename"""
        if filename:
            return filename
        return f'{uuid.uuid4().hex}.{extension}'

    def save_file(
        self,
        content: Union[FileStorage, bytes, str, BinaryIO],
        filename: Optional[str] = None,
        subfolder_name: Optional[str] = None,
        encoding: str = 'utf-8'
    ) -> Tuple[str, str]:
        """Save content to storage and return (relative_path, filename)"""
        if isinstance(content, FileStorage):
            if not content or not content.filename:
                raise ValueError(FileMessages.FILE_REQUIRED)
            source_filename = filename or content.filename
        elif filename:
            source_filename = filename
        else:
            raise ValueError(FileMessages.FILENAME_REQUIRED)

        extension = self._validate_extension(source_filename)

        target_dir = self._get_target_directory(subfolder_name)
        final_filename = self._generate_filename(
            extension, 
            Path(source_filename).name if filename else None
        )
        target_path = target_dir / final_filename

        if isinstance(content, FileStorage):
            content.save(str(target_path))
        elif isinstance(content, str):
            target_path.write_text(content, encoding=encoding)
        elif isinstance(content, bytes):
            target_path.write_bytes(content)
        elif hasattr(content, 'read'):
            with open(target_path, 'wb') as f:
                f.write(content.read())
        else:
            raise ValueError(
                FileMessages.unsupported_content_type(type(content))
            )

        relative_path = str(target_path.relative_to(self.storage_root))
        return relative_path, final_filename

    def read_file(
        self,
        filename: str,
        subfolder_name: Optional[str] = None,
        as_text: bool = False,
        encoding: str = 'utf-8'
    ) -> Union[bytes, str]:
        """Read file content from storage"""
        relative_path = self._build_relative_path(filename, subfolder_name)
        file_path = self.resolve_path(relative_path)

        if as_text:
            return file_path.read_text(encoding=encoding)
        return file_path.read_bytes()

    def resolve_path(self, relative_path: str) -> Path:
        """Resolve and validate a relative path within storage root"""
        normalized = self._normalize_relative_dir(relative_path)
        full_path = (self.storage_root / normalized).resolve()

        if not str(full_path).startswith(str(self.storage_root)):
            raise ValueError(FileMessages.INVALID_PATH)

        if not full_path.exists():
            raise ValueError(FileMessages.FILE_NOT_FOUND)

        return full_path

    def get_file_url(self, filename: str, subfolder_name: Optional[str] = None) -> str:
        """Build a full URL for a file given its folder, subfolder, and filename"""
        if not filename:
            return ''

        relative_path = self._build_relative_path(filename, subfolder_name)
        return f"{Config.STORAGE_URL.rstrip('/')}/{relative_path}"

    def delete_file(self, filename: str, subfolder_name: Optional[str] = None) -> bool:
        """Delete a file from storage and return success status"""
        try:
            if filename:
                relative_path = self._build_relative_path(filename, subfolder_name)
                file_path = self.resolve_path(relative_path)
                if file_path.is_file():
                    file_path.unlink()
                    return True
            return False
        except (ValueError, OSError):
            return False

    def file_exists(self, filename: str, subfolder_name: Optional[str] = None) -> bool:
        """Check if a file exists in storage"""
        try:
            relative_path = self._build_relative_path(filename, subfolder_name)
            file_path = self.resolve_path(relative_path)
            return file_path.is_file()
        except (ValueError, OSError):
            return False


class ImageManager(StorageManager):
    """Manager for handling images"""

    def __init__(self):
        super().__init__()
        self.allowed_extensions = {'.jpg', '.jpeg', '.png'}
        self.folder_name = 'images'


class SEOManager(StorageManager):
    """Manager for handling SEO pre-rendered files"""

    def __init__(self):
        super().__init__()
        self.allowed_extensions = {'.html', '.htm', '.json'}
        self.folder_name = 'seo'
