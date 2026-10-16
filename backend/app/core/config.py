"""Pine Labs Talent Intelligence - Core Configuration"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App
    app_name: str = "Pine Labs Talent Intelligence"
    app_version: str = "1.0.0"
    debug: bool = False

    # LLM
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"

    # Database
    database_url: str = "sqlite+aiosqlite:///./pine_labs_talent.db"

    # Storage
    upload_dir: str = "../../storage"

    # File limits
    max_resume_size_mb: int = 10
    max_project_zip_size_mb: int = 50
    max_zip_uncompressed_size_mb: int = 200
    max_zip_entries: int = 5000
    max_zip_compression_ratio: float = 100.0
    max_file_size_in_zip_mb: int = 20

    # CORS
    frontend_origin: str = "http://localhost:5173"

    # SMTP / Email Configuration
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "careers@pinelabs.com"
    smtp_from_name: str = "Pine Labs Talent Intelligence"
    smtp_use_tls: bool = True

    # LLM limits
    max_resume_text_chars: int = 8000
    max_project_context_chars: int = 15000
    max_single_file_chars: int = 4000
    llm_timeout_seconds: int = 120
    llm_max_retries: int = 3

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
