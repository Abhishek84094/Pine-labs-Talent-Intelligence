"""File validation utilities"""
import hashlib
import os
import zipfile
from pathlib import Path
from typing import Optional
from app.core.config import get_settings

settings = get_settings()

ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_ZIP_EXTENSIONS = {".zip"}

# Sensitive file patterns to exclude from LLM analysis
SENSITIVE_PATTERNS = {
    ".env", ".env.local", ".env.production", ".env.development",
    "secrets.yaml", "secrets.yml", "credentials.json",
    "private_key", "id_rsa", "id_dsa", "id_ecdsa",
    ".pem", ".key", ".pfx", ".p12",
    "token.json", "oauth.json",
}

EXCLUDE_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv", "env",
    ".env", "dist", "build", ".next", ".nuxt", "target", "bin",
    ".gradle", ".idea", ".vscode", "coverage", ".coverage",
    "htmlcoverage", ".pytest_cache", "eggs", ".eggs",
    "*.egg-info", "site-packages",
}

EXCLUDE_EXTENSIONS = {
    ".pyc", ".pyo", ".class", ".jar", ".war", ".exe", ".dll",
    ".so", ".dylib", ".bin", ".dat", ".db", ".sqlite", ".sqlite3",
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".ico", ".svg",
    ".mp3", ".mp4", ".avi", ".mov", ".wav",
    ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
    ".lock",  # package-lock.json etc excluded separately
    ".min.js", ".min.css",
    ".map",
    ".whl", ".egg",
    ".h5", ".pkl", ".pt", ".pth", ".onnx", ".pb",  # ML model weights
    ".csv", ".tsv",  # datasets (may be large)
    ".parquet", ".feather",
}

PRIORITY_FILENAMES = {
    "readme.md", "readme.rst", "readme.txt", "readme",
    "requirements.txt", "pyproject.toml", "setup.py", "setup.cfg",
    "package.json", "package-lock.json",
    "cargo.toml", "go.mod", "pom.xml", "build.gradle",
    "dockerfile", "docker-compose.yml", "docker-compose.yaml",
    "main.py", "app.py", "index.py", "server.py", "manage.py",
    "index.ts", "index.js", "app.ts", "app.js", "server.ts", "server.js",
    "main.ts", "main.js",
    ".github/workflows",
    "makefile",
}


def validate_resume_file(filename: str, file_size: int) -> Optional[str]:
    """Returns error message or None if valid"""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_RESUME_EXTENSIONS:
        return f"Unsupported resume format '{ext}'. Please upload a PDF or DOCX file."
    max_bytes = settings.max_resume_size_mb * 1024 * 1024
    if file_size > max_bytes:
        return f"Resume file is too large ({file_size // (1024*1024)} MB). Maximum allowed: {settings.max_resume_size_mb} MB."
    if file_size == 0:
        return "Resume file is empty."
    return None


def validate_zip_file(filename: str, file_size: int) -> Optional[str]:
    """Returns error message or None if valid"""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_ZIP_EXTENSIONS:
        return f"Project must be uploaded as a ZIP archive. Got: '{ext}'."
    max_bytes = settings.max_project_zip_size_mb * 1024 * 1024
    if file_size > max_bytes:
        return f"ZIP file is too large ({file_size // (1024*1024)} MB). Maximum: {settings.max_project_zip_size_mb} MB."
    if file_size == 0:
        return "ZIP file is empty."
    return None


def compute_file_hash(file_path: str) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def validate_zip_safety(file_path: str) -> Optional[str]:
    """
    Validate ZIP archive for safety issues.
    Returns error message or None if safe.
    """
    settings = get_settings()
    max_uncompressed = settings.max_zip_uncompressed_size_mb * 1024 * 1024
    max_entries = settings.max_zip_entries
    max_ratio = settings.max_zip_compression_ratio
    max_single = settings.max_file_size_in_zip_mb * 1024 * 1024

    try:
        with zipfile.ZipFile(file_path, "r") as zf:
            # Check for encryption
            for info in zf.infolist():
                if info.flag_bits & 0x1:
                    return "Encrypted ZIP archives are not supported."

            entries = zf.infolist()

            if len(entries) > max_entries:
                return f"ZIP archive contains too many files ({len(entries)}). Maximum: {max_entries}."

            total_uncompressed = 0
            for info in entries:
                name = info.filename

                # Path traversal check
                if ".." in name or name.startswith("/") or name.startswith("\\"):
                    return f"Unsafe file path detected in ZIP: '{name}'"

                # Absolute path check
                if os.path.isabs(name):
                    return f"Absolute path detected in ZIP: '{name}'"

                # Single file size
                if info.file_size > max_single:
                    return f"File '{name}' in ZIP is too large ({info.file_size // (1024*1024)} MB). Maximum per-file: {settings.max_file_size_in_zip_mb} MB."

                # Compression ratio (bomb detection)
                if info.compress_size > 0:
                    ratio = info.file_size / info.compress_size
                    if ratio > max_ratio:
                        return f"Suspicious compression ratio in '{name}' ({ratio:.0f}x). Possible ZIP bomb."

                total_uncompressed += info.file_size

            if total_uncompressed > max_uncompressed:
                return f"Total uncompressed size ({total_uncompressed // (1024*1024)} MB) exceeds limit ({settings.max_zip_uncompressed_size_mb} MB)."

    except zipfile.BadZipFile:
        return "The uploaded file is not a valid ZIP archive or is corrupted."
    except Exception as e:
        return f"Could not read ZIP archive: {str(e)}"

    return None


def is_sensitive_file(filename: str) -> bool:
    """Check if a file should be excluded from LLM analysis"""
    name_lower = filename.lower()
    base = os.path.basename(name_lower)
    for pattern in SENSITIVE_PATTERNS:
        if pattern in base or base.endswith(pattern):
            return True
    return False


def should_exclude_path(path: str) -> bool:
    """Check if a path should be excluded from analysis"""
    parts = Path(path).parts
    for part in parts:
        if part.lower() in EXCLUDE_DIRS:
            return True
        if part.lower().endswith(".egg-info"):
            return True
    return False


def get_file_priority(filename: str) -> int:
    """Return priority score for file selection (lower = higher priority)"""
    name = os.path.basename(filename).lower()
    rel = filename.lower().replace("\\", "/")

    for i, priority_name in enumerate(PRIORITY_FILENAMES):
        if name == priority_name or rel.endswith(priority_name):
            return i

    ext = Path(filename).suffix.lower()
    source_exts = {".py", ".ts", ".js", ".java", ".go", ".rs", ".rb", ".cs", ".cpp", ".c", ".kt"}
    if ext in source_exts:
        return 100
    if ext in {".md", ".rst", ".txt"}:
        return 50
    if ext in {".yaml", ".yml", ".toml", ".json", ".ini", ".cfg"}:
        return 70

    return 200
