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


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    groq_configured: bool
    database: str
