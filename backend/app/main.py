"""FastAPI application entry point"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.db.database import init_db
from app.api.routes import health, submissions

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")

    # Ensure storage directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    if not settings.groq_api_key:
        logger.warning(
            "GROQ_API_KEY is not configured. LLM analysis will not be available. "
            "Set it in backend/.env to enable evaluation."
        )
    else:
        logger.info(f"Groq configured with model: {settings.groq_model}")

    yield

    logger.info("Application shutting down")


app = FastAPI(
    title="Pine Labs Talent Intelligence API",
    description="""
    AI-powered candidate project and resume evaluation platform.
    
    **Features:**
    - Candidate submission with resume and project ZIP upload
    - AI-powered resume analysis using Groq + LangChain
    - Static project code inspection (no code execution)
    - Evidence-based technical evaluation reports
    - Hiring team dashboard with search and filtering
    
    **Privacy:** Submitted files are processed by the configured LLM provider (Groq) for evaluation purposes.
    """,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_origin_regex=r"https://.*(\.vercel\.app|\.onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."},
    )


# Optional: Mount frontend static build if dist exists (single-service deployment)
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.isdir(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        target_file = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(dist_dir, "index.html"))
else:
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "docs": "/api/docs",
            "status": "running",
        }
