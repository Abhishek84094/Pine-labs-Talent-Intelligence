"""Pydantic schemas for API requests and responses"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, HttpUrl, Field, field_validator
import re


# ─── Candidate Submission ───────────────────────────────────────────────────

class CandidateSubmissionCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    email: str = Field(..., max_length=200)
    phone: str = Field(..., min_length=7, max_length=50)
    job_role: str = Field(..., min_length=2, max_length=200)
    github_url: Optional[str] = Field(None, max_length=500)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid email address format")
        return v.lower().strip()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?[0-9]{7,15}$", cleaned):
            raise ValueError("Invalid phone number format")
        return v.strip()

    @field_validator("github_url", "linkedin_url", "portfolio_url", mode="before")
    @classmethod
    def normalize_url(cls, v: Any) -> Optional[str]:
        if not v or v.strip() == "":
            return None
        url = v.strip()
        if url and not url.startswith(("http://", "https://")):
            url = "https://" + url
        pattern = r"^https?://[^\s/$.?#].[^\s]*$"
        if not re.match(pattern, url):
            raise ValueError(f"Invalid URL: {v}")
        return url


class SubmissionResponse(BaseModel):
    id: str
    reference_id: str
    full_name: str
    email: str
    phone: str
    job_role: str
    github_url: Optional[str]
    linkedin_url: Optional[str]
    portfolio_url: Optional[str]
    resume_filename: str
    resume_file_size: int
    project_filename: str
    project_file_size: int
    status: str
    error_message: Optional[str]
    review_status: Optional[str] = "pending"
    review_checklist: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    email_sent: Optional[bool] = False
    email_sent_at: Optional[datetime] = None
    interview_details: Optional[str] = None
    submitted_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubmissionListItem(BaseModel):
    id: str
    reference_id: str
    full_name: str
    email: str
    job_role: str
    status: str
    review_status: Optional[str] = "pending"
    review_checklist: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    email_sent: Optional[bool] = False
    email_sent_at: Optional[datetime] = None
    interview_details: Optional[str] = None
    submitted_at: datetime
    resume_filename: str
    project_filename: str

    class Config:
        from_attributes = True


class SubmissionListResponse(BaseModel):
    submissions: list[SubmissionListItem]
    total: int
    skip: int
    limit: int


class StatsResponse(BaseModel):
    total: int
    pending: int
    completed: int
    failed: int
    reviewed: Optional[int] = 0
    shortlisted: Optional[int] = 0


# ─── Hiring Review & Shortlist Schemas ──────────────────────────────────────

class ReviewUpdateRequest(BaseModel):
    review_status: str = Field(default="reviewed", description="pending, reviewed, shortlisted, or rejected")
    review_checklist: Optional[dict[str, Any]] = Field(default=None)
    reviewed_by: Optional[str] = Field(default="Hiring Team")


class BatchReviewRequest(BaseModel):
    submission_ids: list[str] = Field(..., min_length=1)
    review_status: str = Field(default="reviewed")
    reviewed_by: Optional[str] = Field(default="Hiring Team")


class InterviewInvitationRequest(BaseModel):
    submission_ids: list[str] = Field(..., min_length=1)
    assessment_date: str = Field(..., min_length=3)
    technical_date: str = Field(..., min_length=3)
    hr_date: str = Field(..., min_length=3)
    custom_message: Optional[str] = None
    subject: Optional[str] = None


class InterviewInvitationResponse(BaseModel):
    total_processed: int
    successful_count: int
    delivery_mode: str
    results: list[dict[str, Any]]
    preview_html: Optional[str] = None
    message: str


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    groq_configured: bool
    database: str
