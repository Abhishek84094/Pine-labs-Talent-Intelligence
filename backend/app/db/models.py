"""SQLAlchemy database models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, Float, JSON, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base
import enum


def utcnow():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class ProcessingStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    VALIDATING = "validating"
    QUEUED = "queued"
    ANALYZING_RESUME = "analyzing_resume"
    ANALYZING_PROJECT = "analyzing_project"
    SYNTHESIZING_REPORT = "synthesizing_report"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    reference_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    # Candidate info
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    job_role: Mapped[str] = mapped_column(String(200), nullable=False)
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # File metadata
    resume_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    resume_file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    resume_file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    resume_file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    project_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    project_file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    project_file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    project_file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Processing
    status: Mapped[str] = mapped_column(
        String(50), default=ProcessingStatus.UPLOADED, nullable=False
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    warnings: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list

    # Analysis results (stored as JSON)
    resume_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    project_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    evaluation_report: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON

    # LLM config used
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Hiring Review & Shortlist Checklist
    review_status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False
    )  # pending, reviewed, shortlisted, rejected
    review_checklist: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON checklist
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reviewed_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    interview_details: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON schedule

    # Timestamps
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    analysis_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    analysis_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
