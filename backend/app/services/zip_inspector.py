"""ZIP archive inspection engine"""
import os
import zipfile
import tempfile
import shutil
from pathlib import Path
from typing import Optional
from app.core.config import get_settings
from app.utils.file_validation import (
    should_exclude_path,
    is_sensitive_file,
    EXCLUDE_EXTENSIONS,
    get_file_priority,
)
from app.api.schemas.evaluation import ProjectInventory, InspectedFile

settings = get_settings()

ECOSYSTEM_MARKERS = {
    "Python": ["requirements.txt", "pyproject.toml", "setup.py", "setup.cfg", ".py"],
    "JavaScript/Node.js": ["package.json", ".js", ".mjs"],
    "TypeScript": [".ts", ".tsx", "tsconfig.json"],
    "React": [".jsx", ".tsx", "react"],  # checked in package.json too
    "Java": ["pom.xml", "build.gradle", ".java"],
    "Go": ["go.mod", "go.sum", ".go"],
    "Rust": ["Cargo.toml", ".rs"],
    "C/C++": [".c", ".cpp", ".h", ".hpp", "CMakeLists.txt"],
    "Machine Learning": [".ipynb", "train.py", "model.py", "dataset.py"],
    "Docker": ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"],
    "CI/CD": [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile", ".circleci"],
}

README_NAMES = {"readme.md", "readme.rst", "readme.txt", "readme"}
DEPENDENCY_MANIFESTS = {
    "requirements.txt", "pyproject.toml", "setup.py", "setup.cfg",
    "package.json", "pom.xml", "build.gradle", "go.mod", "Cargo.toml",
    "Gemfile", "composer.json",
}
CONFIG_PATTERNS = {".yaml", ".yml", ".toml", ".ini", ".cfg", ".json", ".env.example"}
TEST_PATTERNS = {"test_", "_test.", "spec.", ".spec.", "tests/", "test/", "__tests__/"}
CI_FILES = {".github/workflows", ".gitlab-ci.yml", "jenkinsfile", ".circleci", ".travis.yml"}


def inspect_zip(file_path: str) -> tuple[ProjectInventory, list[tuple[str, str]]]:
    """
    Inspect a ZIP archive and return structured inventory + selected file contents.

    Returns:
        (ProjectInventory, [(relative_path, content_text), ...])
        The second list contains the content of prioritized files for LLM analysis.
    """
    warnings = []
    inspected: list[InspectedFile] = []
    skipped: list[InspectedFile] = []
    selected_contents: list[tuple[str, str]] = []

    # Stats
    total_files = 0
    total_size = 0
    top_level_folders: set[str] = set()
    extension_counts: dict[str, int] = {}
    readme_files: list[str] = []
    manifests: list[str] = []
    source_files: list[str] = []
    test_files: list[str] = []
    config_files: list[str] = []
    ci_files: list[str] = []
    docker_files: list[str] = []
    sensitive_excluded: list[str] = []
    detected_ecosystems: set[str] = set()

    # Candidates for LLM analysis (path, priority, size)
    candidates: list[tuple[str, int, int]] = []

    try:
        with zipfile.ZipFile(file_path, "r") as zf:
            entries = zf.infolist()

            for info in entries:
                name = info.filename

                # Skip directories
                if name.endswith("/"):
                    # Track top-level folders
                    parts = name.split("/")
                    if len(parts) >= 2 and parts[0]:
                        top_level_folders.add(parts[0])
                    continue

                total_files += 1
                total_size += info.file_size

                # Track top-level folder
                parts = name.split("/")
                if len(parts) > 1:
                    top_level_folders.add(parts[0])

                # Extension stats
                ext = Path(name).suffix.lower()
                extension_counts[ext] = extension_counts.get(ext, 0) + 1

                # Categorize
                basename = os.path.basename(name).lower()
                name_lower = name.lower()

                if basename in README_NAMES:
                    readme_files.append(name)
                if basename in {m.lower() for m in DEPENDENCY_MANIFESTS}:
                    manifests.append(name)
                if any(ci in name_lower for ci in CI_FILES):
                    ci_files.append(name)
                if basename in {"dockerfile", "docker-compose.yml", "docker-compose.yaml"}:
                    docker_files.append(name)
                if any(t in name_lower for t in TEST_PATTERNS):
                    test_files.append(name)
                if ext in CONFIG_PATTERNS and basename not in {"package-lock.json", "yarn.lock"}:
                    config_files.append(name)
                if ext in {".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rs", ".cpp", ".c"}:
                    source_files.append(name)

                # Detect ecosystems
                for eco, markers in ECOSYSTEM_MARKERS.items():
                    for marker in markers:
                        if marker.startswith(".") and ext == marker:
                            detected_ecosystems.add(eco)
                        elif marker in name_lower or basename == marker.lower():
                            detected_ecosystems.add(eco)

                # Skip decision
                skip_reason = None

                if should_exclude_path(name):
                    skip_reason = "Excluded directory (node_modules, .git, etc.)"
                elif is_sensitive_file(name):
                    skip_reason = "Sensitive file excluded from LLM analysis"
                    sensitive_excluded.append(name)
                elif ext in EXCLUDE_EXTENSIONS:
                    skip_reason = f"Binary/generated file type excluded ({ext})"
                elif basename.endswith(".lock") and basename != "cargo.lock":
                    skip_reason = "Lock file excluded"
                elif info.file_size == 0:
                    skip_reason = "Empty file"
                elif info.file_size > settings.max_file_size_in_zip_mb * 1024 * 1024:
                    skip_reason = f"File too large for analysis ({info.file_size // 1024} KB)"

                if skip_reason:
                    skipped.append(InspectedFile(
                        path=name,
                        size_bytes=info.file_size,
                        extension=ext,
                        was_analyzed=False,
                        skip_reason=skip_reason,
                    ))
                    continue

                # This file is a candidate
                priority = get_file_priority(name)
                candidates.append((name, priority, info.file_size))

            # Sort candidates by priority
            candidates.sort(key=lambda x: (x[1], x[2]))

            # Select files within token budget
            budget_chars = settings.max_project_context_chars
            used_chars = 0
            max_single = settings.max_single_file_chars

            for name, priority, size in candidates:
                try:
                    raw = zf.read(name)
                    # Try to decode as text
                    try:
                        content = raw.decode("utf-8", errors="replace")
                    except Exception:
                        skipped.append(InspectedFile(
                            path=name,
                            size_bytes=size,
                            extension=Path(name).suffix.lower(),
                            was_analyzed=False,
                            skip_reason="Could not decode as text",
                        ))
                        continue

                    # Truncate single file
                    if len(content) > max_single:
                        content = content[:max_single] + f"\n... [truncated from {len(content)} chars]"

                    if used_chars + len(content) > budget_chars:
                        skipped.append(InspectedFile(
                            path=name,
                            size_bytes=size,
                            extension=Path(name).suffix.lower(),
                            was_analyzed=False,
                            skip_reason="Token budget exhausted",
                        ))
                        continue

                    used_chars += len(content)
                    selected_contents.append((name, content))
                    excerpt = content[:500] if len(content) > 500 else content
                    inspected.append(InspectedFile(
                        path=name,
                        size_bytes=size,
                        extension=Path(name).suffix.lower(),
                        was_analyzed=True,
                        content_excerpt=excerpt,
                    ))

                except Exception as e:
                    skipped.append(InspectedFile(
                        path=name,
                        size_bytes=size,
                        extension=Path(name).suffix.lower(),
                        was_analyzed=False,
                        skip_reason=f"Read error: {str(e)}",
                    ))

    except zipfile.BadZipFile:
        warnings.append("ZIP archive could not be opened for inspection.")
    except Exception as e:
        warnings.append(f"ZIP inspection error: {str(e)}")

    inventory = ProjectInventory(
        total_files=total_files,
        total_size_bytes=total_size,
        top_level_folders=sorted(top_level_folders),
        file_extensions=extension_counts,
        readme_files=readme_files,
        dependency_manifests=manifests,
        source_files=source_files[:100],  # cap list size
        test_files=test_files,
        config_files=config_files,
        ci_cd_files=ci_files,
        docker_files=docker_files,
        sensitive_files_excluded=sensitive_excluded,
        inspected_files=inspected,
        skipped_files=skipped[:50],  # cap for response size
        detected_ecosystems=sorted(detected_ecosystems),
        warnings=warnings,
    )

    return inventory, selected_contents
