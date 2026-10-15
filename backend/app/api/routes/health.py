"""Health check endpoint"""
from fastapi import APIRouter
from app.api.schemas.candidate import HealthResponse
from app.core.config import get_settings
from app.llm.groq_client import is_groq_configured

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint - returns application status"""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        groq_configured=is_groq_configured(),
        database="sqlite",
    )
