"""Submissions API routes"""
import json
import logging
import os
import random
import string
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.candidate import (
    CandidateSubmissionCreate,
    SubmissionListResponse,
    SubmissionListItem,
    SubmissionResponse,
    StatsResponse,
    ReviewUpdateRequest,
    BatchReviewRequest,
    InterviewInvitationRequest,
    InterviewInvitationResponse,
)
from app.core.config import get_settings
from app.db.database import get_db
from app.db.repository import SubmissionRepository
from app.services.evaluation_service import run_evaluation_pipeline
from app.services.email_service import send_interview_invitation
from app.utils.file_validation import (
    validate_resume_file,
    validate_zip_file,
    validate_zip_safety,
    compute_file_hash,
)

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()


def generate_reference_id() -> str:
    """Generate a human-readable reference ID like PL-2024-A3X7"""
    chars = random.choices(string.ascii_uppercase + string.digits, k=6)
    return "PL-" + "".join(chars)


def get_upload_dir() -> str:
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


@router.post(
    "/submissions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Submissions"],
    summary="Submit candidate application with resume and project ZIP",
)
async def create_submission(
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    job_role: str = Form(...),
    github_url: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    portfolio_url: Optional[str] = Form(None),
    resume: UploadFile = File(...),
    project_zip: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a candidate application with resume and project ZIP.
    Starts background evaluation automatically.
    """
    # Validate candidate data
    try:
        candidate_data = CandidateSubmissionCreate(
            full_name=full_name,
            email=email,
            phone=phone,
            job_role=job_role,
            github_url=github_url or None,
            linkedin_url=linkedin_url or None,
            portfolio_url=portfolio_url or None,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid candidate data: {str(e)}",
        )

    # Read files
    resume_content = await resume.read()
    zip_content = await project_zip.read()

    resume_size = len(resume_content)
    zip_size = len(zip_content)

    # Validate resume
    resume_error = validate_resume_file(resume.filename or "resume", resume_size)
    if resume_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=resume_error,
        )

    # Validate ZIP
    zip_error = validate_zip_file(project_zip.filename or "project.zip", zip_size)
    if zip_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=zip_error,
        )

    # Save files
    upload_dir = get_upload_dir()
    submission_id = str(uuid.uuid4())
    sub_dir = os.path.join(upload_dir, submission_id)
    os.makedirs(sub_dir, exist_ok=True)

    # Use server-generated filenames
    resume_ext = Path(resume.filename or "resume.pdf").suffix.lower()
    resume_server_name = f"resume{resume_ext}"
    resume_path = os.path.join(sub_dir, resume_server_name)

    zip_server_name = "project.zip"
    zip_path = os.path.join(sub_dir, zip_server_name)

    with open(resume_path, "wb") as f:
        f.write(resume_content)

    with open(zip_path, "wb") as f:
        f.write(zip_content)

    # Validate ZIP safety (after saving to disk)
    zip_safety_error = validate_zip_safety(zip_path)
    if zip_safety_error:
        # Clean up
        import shutil
        shutil.rmtree(sub_dir, ignore_errors=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=zip_safety_error,
        )

    # Compute hashes
    resume_hash = compute_file_hash(resume_path)
    zip_hash = compute_file_hash(zip_path)

    # Create submission record
    repo = SubmissionRepository(db)
    reference_id = generate_reference_id()

    submission = await repo.create({
        "id": submission_id,
        "reference_id": reference_id,
        "full_name": candidate_data.full_name,
        "email": candidate_data.email,
        "phone": candidate_data.phone,
        "job_role": candidate_data.job_role,
        "github_url": candidate_data.github_url,
        "linkedin_url": candidate_data.linkedin_url,
        "portfolio_url": candidate_data.portfolio_url,
        "resume_filename": resume.filename or resume_server_name,
        "resume_file_path": resume_path,
        "resume_file_size": resume_size,
        "resume_file_hash": resume_hash,
        "project_filename": project_zip.filename or zip_server_name,
        "project_file_path": zip_path,
        "project_file_size": zip_size,
        "project_file_hash": zip_hash,
        "status": "queued",
        "submitted_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })

    await db.commit()
    await db.refresh(submission)

    # Schedule background evaluation
    background_tasks.add_task(run_evaluation_background, submission_id)

    logger.info(f"New submission created: {reference_id} ({submission_id})")
    return submission


async def run_evaluation_background(submission_id: str):
    """Run evaluation in background with its own DB session"""
    from app.db.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            await run_evaluation_pipeline(submission_id, db)
        except Exception as e:
            logger.error(f"Background evaluation failed for {submission_id}: {e}", exc_info=True)


@router.get(
    "/submissions",
    response_model=SubmissionListResponse,
    tags=["Submissions"],
    summary="List all submissions",
)
async def list_submissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    review_status: Optional[str] = Query(None, alias="review_status"),
    db: AsyncSession = Depends(get_db),
):
    """List submissions with optional search and filtering"""
    repo = SubmissionRepository(db)
    submissions, total = await repo.list_submissions(
        skip=skip,
        limit=limit,
        search=search,
        role_filter=role,
        status_filter=status_filter,
        review_filter=review_status,
    )
    return SubmissionListResponse(
        submissions=[SubmissionListItem.model_validate(s) for s in submissions],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/submissions/stats",
    response_model=StatsResponse,
    tags=["Submissions"],
    summary="Get submission statistics",
)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregate submission statistics for the dashboard"""
    repo = SubmissionRepository(db)
    stats = await repo.get_stats()
    return StatsResponse(**stats)


@router.get(
    "/submissions/{submission_id}",
    response_model=SubmissionResponse,
    tags=["Submissions"],
    summary="Get submission details",
)
async def get_submission(submission_id: str, db: AsyncSession = Depends(get_db)):
    """Get submission details by ID"""
    repo = SubmissionRepository(db)
    sub = await repo.get_by_id(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub


@router.get(
    "/submissions/{submission_id}/status",
    tags=["Submissions"],
    summary="Get evaluation status for polling",
)
async def get_evaluation_status(submission_id: str, db: AsyncSession = Depends(get_db)):
    """Poll endpoint for frontend status updates"""
    repo = SubmissionRepository(db)
    sub = await repo.get_by_id(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    status_messages = {
        "uploaded": "Submission received",
        "validating": "Validating your files...",
        "queued": "Queued for analysis",
        "analyzing_resume": "Extracting and analyzing your resume...",
        "analyzing_project": "Inspecting your project files...",
        "synthesizing_report": "Preparing your evaluation report...",
        "completed": "Evaluation complete",
        "partial": "Evaluation partially complete",
        "failed": "Evaluation encountered an error",
    }

    return {
        "submission_id": submission_id,
        "reference_id": sub.reference_id,
        "status": sub.status,
        "stage_message": status_messages.get(sub.status, sub.status),
        "error_message": sub.error_message,
        "report_available": sub.status in ("completed", "partial") and sub.evaluation_report is not None,
        "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
        "completed_at": sub.analysis_completed_at.isoformat() if sub.analysis_completed_at else None,
    }


@router.get(
    "/submissions/{submission_id}/report",
    tags=["Evaluations"],
    summary="Get full evaluation report",
)
async def get_evaluation_report(submission_id: str, db: AsyncSession = Depends(get_db)):
    """Get the full evaluation report for a submission"""
    repo = SubmissionRepository(db)
    sub = await repo.get_by_id(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if sub.status == "failed" and not sub.evaluation_report:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Evaluation failed: {sub.error_message or 'Unknown error'}",
        )

    if not sub.evaluation_report:
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Evaluation is still in progress",
        )

    try:
        report_data = json.loads(sub.evaluation_report)
        resume_data = json.loads(sub.resume_analysis) if sub.resume_analysis else None
        project_data = json.loads(sub.project_analysis) if sub.project_analysis else None

        return {
            "submission_id": submission_id,
            "reference_id": sub.reference_id,
            "candidate": {
                "name": sub.full_name,
                "email": sub.email,
                "role": sub.job_role,
                "github_url": sub.github_url,
                "linkedin_url": sub.linkedin_url,
                "portfolio_url": sub.portfolio_url,
            },
            "status": sub.status,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "completed_at": sub.analysis_completed_at.isoformat() if sub.analysis_completed_at else None,
            "warnings": json.loads(sub.warnings) if sub.warnings else [],
            "report": report_data,
            "resume_analysis": resume_data,
            "project_analysis": project_data,
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Report data corrupted: {str(e)}")


@router.delete(
    "/submissions/{submission_id}",
    status_code=204,
    tags=["Submissions"],
    summary="Delete a submission",
)
async def delete_submission(submission_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a submission and its files"""
    repo = SubmissionRepository(db)
    sub = await repo.get_by_id(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Clean up files
    import shutil
    sub_dir = os.path.dirname(sub.resume_file_path)
    if os.path.exists(sub_dir):
        shutil.rmtree(sub_dir, ignore_errors=True)

    await db.delete(sub)
    await db.commit()


@router.post(
    "/submissions/{submission_id}/retry",
    tags=["Submissions"],
    summary="Retry failed evaluation",
)
async def retry_evaluation(
    submission_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Retry a failed evaluation"""
    repo = SubmissionRepository(db)
    sub = await repo.get_by_id(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if sub.status not in ("failed", "partial"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot retry submission with status '{sub.status}'",
        )

    await repo.update_status(submission_id, "queued", error_message=None)
    await db.commit()

    background_tasks.add_task(run_evaluation_background, submission_id)

    return {"message": "Evaluation retry scheduled", "submission_id": submission_id}


@router.patch(
    "/submissions/{submission_id}/review",
    response_model=SubmissionResponse,
    tags=["Hiring Review"],
    summary="Update candidate review status and checklist",
)
async def update_candidate_review(
    submission_id: str,
    payload: ReviewUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Mark a candidate submission as reviewed, shortlisted, or rejected, with optional checklist"""
    repo = SubmissionRepository(db)
    sub = await repo.update_review(
        submission_id=submission_id,
        review_status=payload.review_status,
        review_checklist=payload.review_checklist,
        reviewed_by=payload.reviewed_by,
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    await db.commit()
    return sub


@router.post(
    "/submissions/batch-review",
    tags=["Hiring Review"],
    summary="Batch update review status for candidates",
)
async def batch_update_review(
    payload: BatchReviewRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update review status for multiple candidates in one action"""
    repo = SubmissionRepository(db)
    updated_count = 0
    for sub_id in payload.submission_ids:
        sub = await repo.update_review(
            submission_id=sub_id,
            review_status=payload.review_status,
            reviewed_by=payload.reviewed_by,
        )
        if sub:
            updated_count += 1
    await db.commit()
    return {
        "success": True,
        "updated_count": updated_count,
        "review_status": payload.review_status,
        "message": f"Successfully updated {updated_count} candidates to '{payload.review_status}'",
    }


@router.post(
    "/submissions/send-invitation",
    response_model=InterviewInvitationResponse,
    tags=["Hiring Review"],
    summary="Send interview and online assessment shortlist invitations",
)
async def send_shortlist_invitations(
    payload: InterviewInvitationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Send shortlist invitation emails to selected candidates with:
    - Online Assessment date
    - Round 1 (Technical Interview) date
    - Round 2 (HR & Leadership) date
    Automatically updates candidates to 'shortlisted' and records email dispatch.
    """
    repo = SubmissionRepository(db)
    results = []
    success_count = 0
    preview_html = None
    delivery_mode = "simulated"

    interview_details = {
        "assessment_date": payload.assessment_date,
        "technical_date": payload.technical_date,
        "hr_date": payload.hr_date,
        "custom_message": payload.custom_message,
        "invited_at": datetime.now(timezone.utc).isoformat(),
    }

    for sub_id in payload.submission_ids:
        sub = await repo.get_by_id(sub_id)
        if not sub:
            results.append({
                "submission_id": sub_id,
                "success": False,
                "error": "Submission not found",
            })
            continue

        # Send email via email service
        res = await send_interview_invitation(
            recipient_email=sub.email,
            candidate_name=sub.full_name,
            job_role=sub.job_role,
            assessment_date=payload.assessment_date,
            technical_date=payload.technical_date,
            hr_date=payload.hr_date,
            reference_id=sub.reference_id,
            custom_message=payload.custom_message,
            subject=payload.subject,
        )

        delivery_mode = res.get("delivery_mode", "simulated")
        if "preview_html" in res and not preview_html:
            preview_html = res["preview_html"]

        if res.get("success"):
            success_count += 1
            await repo.record_invitation_sent(sub_id, interview_details)

        results.append({
            "submission_id": sub_id,
            "candidate_name": sub.full_name,
            "email": sub.email,
            "role": sub.job_role,
            "success": res.get("success", False),
            "delivery_mode": res.get("delivery_mode"),
            "message": res.get("message"),
        })

    await db.commit()

    return InterviewInvitationResponse(
        total_processed=len(payload.submission_ids),
        successful_count=success_count,
        delivery_mode=delivery_mode,
        results=results,
        preview_html=preview_html,
        message=f"Successfully sent shortlist invitations to {success_count} candidate(s)",
    )


# ─── Email / SMTP Configuration & Test Endpoints ────────────────────────────

class EmailConfigPayload(BaseModel):
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = "Pine Labs Talent Intelligence"


class EmailTestPayload(BaseModel):
    recipient_email: str


@router.get(
    "/email/status",
    tags=["Email Configuration"],
    summary="Check current SMTP configuration status",
)
async def get_email_status():
    """Check if live SMTP credentials are configured"""
    is_live = bool(settings.smtp_host and settings.smtp_user and settings.smtp_password)
    return {
        "is_configured": is_live,
        "mode": "live_smtp" if is_live else "simulated_demo",
        "host": settings.smtp_host or None,
        "port": settings.smtp_port,
        "user": settings.smtp_user or None,
        "from_email": settings.smtp_from_email,
        "from_name": settings.smtp_from_name,
        "message": (
            f"Live SMTP active via {settings.smtp_host} ({settings.smtp_user})"
            if is_live
            else "Simulated demo mode. Real emails will NOT be sent until SMTP credentials are configured."
        ),
    }


@router.post(
    "/email/config",
    tags=["Email Configuration"],
    summary="Update and save SMTP configuration",
)
async def update_email_config(payload: EmailConfigPayload):
    """Save SMTP configuration into backend/.env and update running settings"""
    settings.smtp_host = payload.smtp_host
    settings.smtp_port = payload.smtp_port
    settings.smtp_user = payload.smtp_user
    settings.smtp_password = payload.smtp_password
    settings.smtp_from_email = payload.smtp_from_email or payload.smtp_user
    if payload.smtp_from_name:
        settings.smtp_from_name = payload.smtp_from_name

    # Persist to backend/.env file
    env_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_path = os.path.join(env_dir, ".env")
    try:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

        keys_to_update = {
            "SMTP_HOST": payload.smtp_host,
            "SMTP_PORT": str(payload.smtp_port),
            "SMTP_USER": payload.smtp_user,
            "SMTP_PASSWORD": payload.smtp_password,
            "SMTP_FROM_EMAIL": settings.smtp_from_email,
            "SMTP_FROM_NAME": settings.smtp_from_name,
        }

        new_lines = []
        found_keys = set()
        for line in lines:
            if "=" in line and not line.strip().startswith("#"):
                key = line.split("=")[0].strip()
                if key in keys_to_update:
                    new_lines.append(f"{key}={keys_to_update[key]}\n")
                    found_keys.add(key)
                    continue
            new_lines.append(line)

        for k, v in keys_to_update.items():
            if k not in found_keys:
                new_lines.append(f"{k}={v}\n")

        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)

    except Exception as e:
        logger.warning(f"Could not write to .env file: {e}")

    return {
        "success": True,
        "is_configured": True,
        "message": f"SMTP credentials successfully updated for {payload.smtp_user}",
    }


@router.post(
    "/email/test",
    tags=["Email Configuration"],
    summary="Send a live test verification email",
)
async def send_test_email(payload: EmailTestPayload):
    """Test SMTP connection by sending a real verification email"""
    if not (settings.smtp_host and settings.smtp_user and settings.smtp_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMTP is not configured yet. Please configure SMTP host, user, and password first.",
        )

    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Pine Labs Talent Intelligence — SMTP Verification Test"
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg["To"] = payload.recipient_email

        html_body = f"""
        <div style="font-family: sans-serif; padding: 24px; background-color: #F3F5F1;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px; border: 1px solid #D8E2D2;">
            <div style="background-color: #00262C; color: #D0F255; font-size: 11px; font-weight: bold; padding: 4px 10px; display: inline-block; border-radius: 4px; text-transform: uppercase;">
              PINE LABS
            </div>
            <h2 style="color: #00262C; margin-top: 14px;">SMTP Verification Successful!</h2>
            <p style="color: #4A5D5E; font-size: 14px; line-height: 1.5;">
              This test confirms that your Pine Labs Talent Intelligence platform is properly connected to your email provider (<strong>{settings.smtp_host}</strong>).
            </p>
            <p style="color: #4A5D5E; font-size: 14px; line-height: 1.5;">
              Shortlist invitations sent from the Hiring Dashboard will now be delivered live to candidates' inboxes.
            </p>
            <div style="margin-top: 20px; font-size: 12px; color: #8F9E9F; border-top: 1px solid #E2E8DE; padding-top: 12px;">
              Sent at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
            </div>
          </div>
        </div>
        """
        msg.attach(MIMEText("Pine Labs SMTP Verification Successful. Your platform is ready to send live emails.", "plain"))
        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15)
        if settings.smtp_use_tls:
            server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, payload.recipient_email, msg.as_string())
        server.quit()

        return {
            "success": True,
            "message": f"Verification email successfully sent to {payload.recipient_email}!",
            "recipient": payload.recipient_email,
        }
    except Exception as e:
        logger.error(f"Failed to send test email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SMTP Error: {str(e)}. If using Gmail, make sure you use a 16-character App Password (not your personal Google account password).",
        )


