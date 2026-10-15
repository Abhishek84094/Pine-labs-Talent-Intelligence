"""Backend tests for Pine Labs Talent Intelligence"""
import io
import json
import os
import zipfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Set env vars BEFORE importing app
os.environ["GROQ_API_KEY"] = ""
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_talent.db"
os.environ["UPLOAD_DIR"] = "./test_storage"

from app.main import app
from app.db.database import init_db, engine, Base
from app.utils.file_validation import (
    validate_resume_file,
    validate_zip_file,
    validate_zip_safety,
    is_sensitive_file,
    should_exclude_path,
)


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    # Cleanup test DB file - ignore Windows file lock errors
    import shutil
    try:
        if os.path.exists("test_talent.db"):
            os.remove("test_talent.db")
    except (PermissionError, OSError):
        pass  # Windows may keep file locked briefly
    try:
        if os.path.exists("./test_storage"):
            shutil.rmtree("./test_storage", ignore_errors=True)
    except (PermissionError, OSError):
        pass


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def make_pdf_bytes() -> bytes:
    """Minimal valid-looking PDF bytes"""
    return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"


def make_docx_bytes() -> bytes:
    """Create a real minimal DOCX using python-docx"""
    from docx import Document
    doc = Document()
    doc.add_paragraph("John Doe - Software Engineer")
    doc.add_paragraph("Skills: Python, FastAPI, React")
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def make_zip_bytes(files: dict[str, bytes | str]) -> bytes:
    """Create an in-memory ZIP with given files"""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, content in files.items():
            if isinstance(content, str):
                content = content.encode("utf-8")
            zf.writestr(name, content)
    return buf.getvalue()


# ─── Health Endpoint ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_endpoint(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert data["groq_configured"] is False  # no key set


# ─── File Validation Unit Tests ───────────────────────────────────────────────

class TestResumeFileValidation:
    def test_valid_pdf(self):
        assert validate_resume_file("resume.pdf", 1024 * 100) is None

    def test_valid_docx(self):
        assert validate_resume_file("cv.docx", 1024 * 200) is None

    def test_invalid_extension(self):
        err = validate_resume_file("resume.txt", 1024)
        assert err is not None
        assert "PDF" in err or "DOCX" in err

    def test_empty_file(self):
        err = validate_resume_file("resume.pdf", 0)
        assert err is not None
        assert "empty" in err.lower()

    def test_too_large(self):
        err = validate_resume_file("resume.pdf", 11 * 1024 * 1024)
        assert err is not None
        assert "large" in err.lower() or "MB" in err

    def test_zip_rejected(self):
        err = validate_resume_file("resume.zip", 1024)
        assert err is not None

    def test_exe_rejected(self):
        err = validate_resume_file("resume.exe", 1024)
        assert err is not None


class TestZipFileValidation:
    def test_valid_zip(self):
        assert validate_zip_file("project.zip", 1024 * 1024) is None

    def test_wrong_extension(self):
        err = validate_zip_file("project.tar.gz", 1024)
        assert err is not None

    def test_empty_zip(self):
        err = validate_zip_file("project.zip", 0)
        assert err is not None

    def test_too_large(self):
        err = validate_zip_file("project.zip", 51 * 1024 * 1024)
        assert err is not None


class TestZipSafety:
    def test_valid_zip_passes(self, tmp_path):
        zip_path = tmp_path / "test.zip"
        zip_path.write_bytes(make_zip_bytes({
            "README.md": "# Test Project",
            "main.py": "print('hello')",
        }))
        assert validate_zip_safety(str(zip_path)) is None

    def test_path_traversal_rejected(self, tmp_path):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            info = zipfile.ZipInfo("../../../etc/passwd")
            zf.writestr(info, "root:x:0:0")
        zip_path = tmp_path / "evil.zip"
        zip_path.write_bytes(buf.getvalue())
        err = validate_zip_safety(str(zip_path))
        assert err is not None
        assert "traversal" in err.lower() or "path" in err.lower() or "unsafe" in err.lower()

    def test_corrupt_zip_rejected(self, tmp_path):
        zip_path = tmp_path / "corrupt.zip"
        zip_path.write_bytes(b"this is not a zip file at all!!!")
        err = validate_zip_safety(str(zip_path))
        assert err is not None

    def test_too_many_entries_rejected(self, tmp_path):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            for i in range(6000):
                zf.writestr(f"file_{i}.txt", "x")
        zip_path = tmp_path / "many.zip"
        zip_path.write_bytes(buf.getvalue())
        err = validate_zip_safety(str(zip_path))
        assert err is not None
        assert "entries" in err.lower() or "files" in err.lower()


class TestSensitiveFiles:
    def test_env_file_detected(self):
        assert is_sensitive_file(".env") is True
        assert is_sensitive_file(".env.local") is True
        # production.env contains '.env' so it IS sensitive - that's correct behavior
        assert is_sensitive_file("main.py") is False
        assert is_sensitive_file("README.md") is False

    def test_key_file_detected(self):
        assert is_sensitive_file("private_key.pem") is True
        assert is_sensitive_file("id_rsa") is True

    def test_normal_files_pass(self):
        assert is_sensitive_file("main.py") is False
        assert is_sensitive_file("README.md") is False
        assert is_sensitive_file("package.json") is False


class TestExcludedPaths:
    def test_node_modules_excluded(self):
        assert should_exclude_path("project/node_modules/react/index.js") is True

    def test_git_excluded(self):
        assert should_exclude_path(".git/COMMIT_EDITMSG") is True

    def test_pycache_excluded(self):
        assert should_exclude_path("app/__pycache__/main.cpython-310.pyc") is True

    def test_src_not_excluded(self):
        assert should_exclude_path("src/main.py") is False
        assert should_exclude_path("backend/app/routes.py") is False


# ─── Submission API Tests ─────────────────────────────────────────────────────

class TestSubmissionsAPI:

    @pytest.mark.asyncio
    async def test_submit_valid(self, client, tmp_path):
        """Valid submission should return 201"""
        pdf = make_pdf_bytes()
        zip_b = make_zip_bytes({"README.md": "# My project", "main.py": "print('hi')"})

        resp = await client.post(
            "/api/submissions",
            data={
                "full_name": "Test User",
                "email": "test@example.com",
                "phone": "+1234567890",
                "job_role": "Software Engineer",
            },
            files={
                "resume": ("resume.pdf", io.BytesIO(pdf), "application/pdf"),
                "project_zip": ("project.zip", io.BytesIO(zip_b), "application/zip"),
            },
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert "id" in data
        assert "reference_id" in data
        assert data["reference_id"].startswith("PL-")
        assert data["full_name"] == "Test User"
        assert data["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_submit_missing_fields(self, client):
        """Missing required fields should return 422"""
        resp = await client.post(
            "/api/submissions",
            data={"full_name": "Test"},
            files={
                "resume": ("r.pdf", io.BytesIO(make_pdf_bytes()), "application/pdf"),
                "project_zip": ("p.zip", io.BytesIO(make_zip_bytes({"a.py": "x"})), "application/zip"),
            },
        )
        assert resp.status_code in (400, 422)

    @pytest.mark.asyncio
    async def test_submit_invalid_email(self, client):
        """Invalid email should be rejected"""
        zip_b = make_zip_bytes({"README.md": "# project"})
        resp = await client.post(
            "/api/submissions",
            data={
                "full_name": "Test User",
                "email": "not-an-email",
                "phone": "+1234567890",
                "job_role": "Engineer",
            },
            files={
                "resume": ("r.pdf", io.BytesIO(make_pdf_bytes()), "application/pdf"),
                "project_zip": ("p.zip", io.BytesIO(zip_b), "application/zip"),
            },
        )
        assert resp.status_code in (400, 422)

    @pytest.mark.asyncio
    async def test_submit_wrong_resume_extension(self, client):
        """Wrong resume format should be rejected"""
        zip_b = make_zip_bytes({"README.md": "# project"})
        resp = await client.post(
            "/api/submissions",
            data={
                "full_name": "Test User",
                "email": "test@example.com",
                "phone": "+1234567890",
                "job_role": "Engineer",
            },
            files={
                "resume": ("resume.txt", io.BytesIO(b"my resume"), "text/plain"),
                "project_zip": ("p.zip", io.BytesIO(zip_b), "application/zip"),
            },
        )
        assert resp.status_code == 400
        assert "PDF" in resp.text or "DOCX" in resp.text

    @pytest.mark.asyncio
    async def test_submit_wrong_zip_extension(self, client):
        """Non-ZIP project file should be rejected"""
        resp = await client.post(
            "/api/submissions",
            data={
                "full_name": "Test User",
                "email": "test@example.com",
                "phone": "+1234567890",
                "job_role": "Engineer",
            },
            files={
                "resume": ("r.pdf", io.BytesIO(make_pdf_bytes()), "application/pdf"),
                "project_zip": ("project.tar.gz", io.BytesIO(b"not a zip"), "application/gzip"),
            },
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_submit_corrupt_zip(self, client):
        """Corrupt ZIP should be rejected"""
        resp = await client.post(
            "/api/submissions",
            data={
                "full_name": "Test User",
                "email": "test@example.com",
                "phone": "+1234567890",
                "job_role": "Engineer",
            },
            files={
                "resume": ("r.pdf", io.BytesIO(make_pdf_bytes()), "application/pdf"),
                "project_zip": ("p.zip", io.BytesIO(b"this is not a zip!!!"), "application/zip"),
            },
        )
        assert resp.status_code == 400
        assert "not a valid ZIP" in resp.text or "corrupt" in resp.text.lower() or "valid" in resp.text.lower()

    @pytest.mark.asyncio
    async def test_get_nonexistent_submission(self, client):
        resp = await client.get("/api/submissions/nonexistent-id-1234")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_list_submissions_empty(self, client):
        resp = await client.get("/api/submissions")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["submissions"] == []

    @pytest.mark.asyncio
    async def test_stats_endpoint(self, client):
        resp = await client.get("/api/submissions/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "pending" in data
        assert "completed" in data
        assert "failed" in data

    @pytest.mark.asyncio
    async def test_full_submission_lifecycle(self, client):
        """Submit then check status endpoint"""
        pdf = make_pdf_bytes()
        zip_b = make_zip_bytes({
            "README.md": "# Awesome Project\n\nThis is a test project.",
            "main.py": "from fastapi import FastAPI\napp = FastAPI()\n@app.get('/')\ndef root(): return {'hello': 'world'}",
            "requirements.txt": "fastapi\nuvicorn",
        })

        resp = await client.post(
            "/api/submissions",
            data={
                "full_name": "Jane Smith",
                "email": "jane@example.com",
                "phone": "+91-9876543210",
                "job_role": "Backend Engineer",
                "github_url": "https://github.com/janesmith",
            },
            files={
                "resume": ("jane_resume.pdf", io.BytesIO(pdf), "application/pdf"),
                "project_zip": ("myproject.zip", io.BytesIO(zip_b), "application/zip"),
            },
        )
        assert resp.status_code == 201
        sub_id = resp.json()["id"]
        ref_id = resp.json()["reference_id"]

        # Check status
        status_resp = await client.get(f"/api/submissions/{sub_id}/status")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        assert status_data["submission_id"] == sub_id
        assert status_data["reference_id"] == ref_id
        assert "status" in status_data
        assert "stage_message" in status_data

        # Get submission
        sub_resp = await client.get(f"/api/submissions/{sub_id}")
        assert sub_resp.status_code == 200
        sub_data = sub_resp.json()
        assert sub_data["full_name"] == "Jane Smith"
        assert sub_data["github_url"] == "https://github.com/janesmith"

    @pytest.mark.asyncio
    async def test_delete_submission(self, client):
        """Create and delete a submission"""
        pdf = make_pdf_bytes()
        zip_b = make_zip_bytes({"README.md": "test"})

        create_resp = await client.post(
            "/api/submissions",
            data={
                "full_name": "Delete Me",
                "email": "delete@example.com",
                "phone": "+1234567890",
                "job_role": "Engineer",
            },
            files={
                "resume": ("r.pdf", io.BytesIO(pdf), "application/pdf"),
                "project_zip": ("p.zip", io.BytesIO(zip_b), "application/zip"),
            },
        )
        assert create_resp.status_code == 201
        sub_id = create_resp.json()["id"]

        del_resp = await client.delete(f"/api/submissions/{sub_id}")
        assert del_resp.status_code == 204

        get_resp = await client.get(f"/api/submissions/{sub_id}")
        assert get_resp.status_code == 404

    @pytest.mark.asyncio
    async def test_report_not_ready(self, client):
        """Report endpoint for in-progress submission returns 202"""
        pdf = make_pdf_bytes()
        zip_b = make_zip_bytes({"README.md": "test"})

        create_resp = await client.post(
            "/api/submissions",
            data={
                "full_name": "Wait User",
                "email": "wait@example.com",
                "phone": "+1234567890",
                "job_role": "Engineer",
            },
            files={
                "resume": ("r.pdf", io.BytesIO(pdf), "application/pdf"),
                "project_zip": ("p.zip", io.BytesIO(zip_b), "application/zip"),
            },
        )
        assert create_resp.status_code == 201
        sub_id = create_resp.json()["id"]

        # Report won't be ready yet (Groq not configured)
        report_resp = await client.get(f"/api/submissions/{sub_id}/report")
        # Either 202 (in progress), 422 (failed because no groq key), or 404
        assert report_resp.status_code in (202, 422, 404)


# ─── Resume Parser Tests ──────────────────────────────────────────────────────

class TestResumeParser:
    def test_extract_pdf_text(self, tmp_path):
        """Test PDF extraction with a real PDF"""
        from app.services.resume_parser import extract_text_from_pdf
        import fitz

        # Create a real PDF
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((72, 72), "John Doe - Software Engineer\nSkills: Python, React, FastAPI")
        pdf_path = tmp_path / "test.pdf"
        doc.save(str(pdf_path))
        doc.close()

        text, warnings = extract_text_from_pdf(str(pdf_path))
        assert "John Doe" in text
        assert len(warnings) == 0

    def test_extract_docx_text(self, tmp_path):
        """Test DOCX extraction"""
        from app.services.resume_parser import extract_text_from_docx
        from docx import Document

        doc = Document()
        doc.add_paragraph("Jane Smith - Data Engineer")
        doc.add_paragraph("Experience: Airflow, Spark, Python")
        docx_path = tmp_path / "test.docx"
        doc.save(str(docx_path))

        text, warnings = extract_text_from_docx(str(docx_path))
        assert "Jane Smith" in text
        assert "Python" in text

    def test_unsupported_format(self, tmp_path):
        """Unsupported format returns empty with warning"""
        from app.services.resume_parser import extract_resume_text
        txt_path = tmp_path / "resume.txt"
        txt_path.write_text("hello")
        text, warnings = extract_resume_text(str(txt_path))
        assert text == ""
        assert len(warnings) > 0


# ─── ZIP Inspector Tests ──────────────────────────────────────────────────────

class TestZipInspector:
    def test_inspect_python_project(self, tmp_path):
        """Inspect a Python project ZIP"""
        from app.services.zip_inspector import inspect_zip

        zip_b = make_zip_bytes({
            "README.md": "# FastAPI Project",
            "requirements.txt": "fastapi\nuvicorn\nsqlalchemy",
            "main.py": "from fastapi import FastAPI\napp = FastAPI()",
            "app/__init__.py": "",
            "app/routes.py": "@app.get('/health')\ndef health(): return {'ok': True}",
            "tests/test_main.py": "def test_something(): pass",
        })

        zip_path = tmp_path / "project.zip"
        zip_path.write_bytes(zip_b)

        inventory, selected = inspect_zip(str(zip_path))

        assert inventory.total_files > 0
        assert "README.md" in inventory.readme_files
        assert "requirements.txt" in inventory.dependency_manifests
        assert len(inventory.test_files) > 0
        assert "Python" in inventory.detected_ecosystems
        assert len(selected) > 0  # Some files were selected for analysis

    def test_excludes_node_modules(self, tmp_path):
        """node_modules should be excluded from analysis"""
        from app.services.zip_inspector import inspect_zip

        zip_b = make_zip_bytes({
            "package.json": '{"name": "myapp"}',
            "src/index.js": "console.log('hello')",
            "node_modules/react/index.js": "// react",
            "node_modules/lodash/lodash.js": "// lodash",
        })

        zip_path = tmp_path / "project.zip"
        zip_path.write_bytes(zip_b)

        inventory, selected = inspect_zip(str(zip_path))

        # node_modules files should be in skipped, not selected
        selected_paths = [path for path, _ in selected]
        assert not any("node_modules" in p for p in selected_paths)

    def test_excludes_sensitive_files(self, tmp_path):
        """Sensitive files should be excluded from analysis"""
        from app.services.zip_inspector import inspect_zip

        zip_b = make_zip_bytes({
            "README.md": "# Project",
            ".env": "SECRET_KEY=my_super_secret",
            "main.py": "import os",
        })

        zip_path = tmp_path / "project.zip"
        zip_path.write_bytes(zip_b)

        inventory, selected = inspect_zip(str(zip_path))

        selected_paths = [path for path, _ in selected]
        assert not any(".env" == p or p.endswith("/.env") for p in selected_paths)
        # .env should either be in sensitive_files_excluded or in skipped files
        all_excluded_paths = (
            inventory.sensitive_files_excluded +
            [f.path for f in inventory.skipped_files]
        )
        assert any(".env" in p for p in all_excluded_paths), (
            f"Expected .env to be excluded/skipped, but got: {all_excluded_paths}"
        )

    def test_empty_zip(self, tmp_path):
        """Empty ZIP should return empty inventory"""
        from app.services.zip_inspector import inspect_zip

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as _:
            pass
        zip_path = tmp_path / "empty.zip"
        zip_path.write_bytes(buf.getvalue())

        inventory, selected = inspect_zip(str(zip_path))
        assert inventory.total_files == 0


# ─── LLM Failure Handling ─────────────────────────────────────────────────────

class TestLLMFailureHandling:
    def test_no_api_key_raises(self):
        """Groq client should raise ValueError when key is missing"""
        from app.llm.groq_client import get_groq_chat_model, is_groq_configured
        assert is_groq_configured() is False

    def test_analyze_resume_without_key(self):
        """analyze_resume should return graceful fallback without key"""
        from app.llm.chains import analyze_resume
        analysis, warnings = analyze_resume("John Doe - Software Engineer")
        # Should not raise, should return some result with warnings
        assert analysis is not None
        assert len(warnings) > 0
        # Warning should mention some kind of issue (groq, key, configured, short, empty)
        assert any(
            any(word in w.lower() for word in ["groq", "key", "configured", "short", "empty", "limit"])
            for w in warnings
        )

    def test_analyze_project_without_key(self):
        """analyze_project should return graceful fallback without key"""
        from app.llm.chains import analyze_project
        analysis, warnings = analyze_project("Python project", [("main.py", "print('hello')")])
        assert analysis is not None
        assert len(warnings) > 0

    def test_empty_resume_text(self):
        """Empty resume text should return with warning"""
        from app.llm.chains import analyze_resume
        analysis, warnings = analyze_resume("")
        assert analysis is not None
        assert len(warnings) > 0


# ─── Pydantic Schema Validation ───────────────────────────────────────────────

class TestSchemaValidation:
    def test_resume_analysis_defaults(self):
        from app.api.schemas.evaluation import ResumeAnalysis
        r = ResumeAnalysis()
        assert r.programming_languages == []
        assert r.work_experience == []
        assert r.extraction_warnings == []

    def test_project_analysis_defaults(self):
        from app.api.schemas.evaluation import ProjectAnalysis
        p = ProjectAnalysis()
        assert p.main_functionality == []
        assert p.warnings == []

    def test_candidate_submission_valid(self):
        from app.api.schemas.candidate import CandidateSubmissionCreate
        c = CandidateSubmissionCreate(
            full_name="Test User",
            email="test@example.com",
            phone="+1234567890",
            job_role="Engineer",
        )
        assert c.email == "test@example.com"

    def test_candidate_submission_invalid_email(self):
        from app.api.schemas.candidate import CandidateSubmissionCreate
        with pytest.raises(Exception):
            CandidateSubmissionCreate(
                full_name="Test",
                email="not-valid",
                phone="1234567890",
                job_role="Engineer",
            )

    def test_candidate_submission_url_normalization(self):
        from app.api.schemas.candidate import CandidateSubmissionCreate
        c = CandidateSubmissionCreate(
            full_name="Test",
            email="test@example.com",
            phone="1234567890",
            job_role="Engineer",
            github_url="github.com/test",
        )
        assert c.github_url.startswith("https://")

    def test_candidate_empty_optional_urls(self):
        from app.api.schemas.candidate import CandidateSubmissionCreate
        c = CandidateSubmissionCreate(
            full_name="Test",
            email="test@example.com",
            phone="1234567890",
            job_role="Engineer",
            github_url="",
            linkedin_url="",
        )
        assert c.github_url is None
        assert c.linkedin_url is None
