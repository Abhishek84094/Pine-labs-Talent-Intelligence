"""Main evaluation orchestration service"""
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import ProcessingStatus
from app.db.repository import SubmissionRepository
from app.services.resume_parser import extract_resume_text
from app.services.zip_inspector import inspect_zip
from app.llm.chains import analyze_resume, analyze_project, synthesize_report
from app.llm.groq_client import is_groq_configured

logger = logging.getLogger(__name__)
settings = get_settings()


def format_inventory_summary(inventory) -> str:
    """Format project inventory into a human-readable summary for LLM"""
    lines = [
        f"Project Statistics:",
        f"  Total files: {inventory.total_files}",
        f"  Total size: {inventory.total_size_bytes / 1024:.1f} KB",
        f"  Top-level folders: {', '.join(inventory.top_level_folders) or 'none'}",
        f"  Detected ecosystems: {', '.join(inventory.detected_ecosystems) or 'unknown'}",
        f"",
        f"Key Files Found:",
        f"  README files: {', '.join(inventory.readme_files) or 'none'}",
        f"  Dependency manifests: {', '.join(inventory.dependency_manifests) or 'none'}",
        f"  Test files: {len(inventory.test_files)} files",
        f"  Docker/CI files: {', '.join(inventory.docker_files + inventory.ci_cd_files) or 'none'}",
        f"",
        f"File Extensions:",
    ]
    for ext, count in sorted(inventory.file_extensions.items(), key=lambda x: -x[1])[:10]:
        lines.append(f"  {ext or '(no ext)'}: {count} files")

    if inventory.sensitive_files_excluded:
        lines.append(f"\nSensitive files excluded from analysis: {len(inventory.sensitive_files_excluded)}")

    if inventory.warnings:
        lines.append(f"\nWarnings: {'; '.join(inventory.warnings)}")

    lines.append(f"\nFiles analyzed: {len(inventory.inspected_files)}")
    lines.append(f"Files skipped: {len(inventory.skipped_files)}")

    return "\n".join(lines)


async def run_evaluation_pipeline(submission_id: str, db: AsyncSession) -> None:
    """
    Run the full evaluation pipeline for a submission.
    Updates the submission status at each stage.
    """
    repo = SubmissionRepository(db)

    try:
        # Get submission
        sub = await repo.get_by_id(submission_id)
        if not sub:
            logger.error(f"Submission {submission_id} not found")
            return

        all_warnings = []

        if not is_groq_configured():
            await repo.update_status(
                submission_id,
                ProcessingStatus.FAILED,
                error_message="Groq API key not configured. Please set GROQ_API_KEY in backend/.env",
            )
            await db.commit()
            return

        # Stage 1: Analyze Resume
        await repo.update_status(
            submission_id,
            ProcessingStatus.ANALYZING_RESUME,
            analysis_started_at=datetime.now(timezone.utc),
        )
        await db.commit()

        resume_text, resume_warnings = extract_resume_text(sub.resume_file_path)
        all_warnings.extend(resume_warnings)

        resume_analysis, ra_warnings = analyze_resume(resume_text)
        all_warnings.extend(ra_warnings)

        await repo.save_resume_analysis(submission_id, resume_analysis.model_dump())
        await db.commit()

        # Stage 2: Inspect and Analyze Project
        await repo.update_status(submission_id, ProcessingStatus.ANALYZING_PROJECT)
        await db.commit()

        inventory, selected_files = inspect_zip(sub.project_file_path)
        all_warnings.extend(inventory.warnings)

        inventory_summary = format_inventory_summary(inventory)
        project_analysis, pa_warnings = analyze_project(inventory_summary, selected_files)
        all_warnings.extend(pa_warnings)

        await repo.save_project_analysis(submission_id, project_analysis.model_dump())
        await db.commit()

        # Stage 3: Synthesize Report
        await repo.update_status(submission_id, ProcessingStatus.SYNTHESIZING_REPORT)
        await db.commit()

        candidate_name = resume_analysis.candidate_name or sub.full_name

        report, sr_warnings = synthesize_report(
            candidate_name=candidate_name,
            job_role=sub.job_role,
            submission_id=submission_id,
            resume_analysis=resume_analysis,
            project_analysis=project_analysis,
            inventory_summary=inventory_summary,
        )
        all_warnings.extend(sr_warnings)

        await repo.save_evaluation_report(submission_id, report.model_dump())

        # Determine final status
        has_llm_failure = any("failed" in w.lower() or "not configured" in w.lower() for w in all_warnings)
        final_status = ProcessingStatus.PARTIAL if has_llm_failure else ProcessingStatus.COMPLETED

        await repo.update_status(
            submission_id,
            final_status,
            warnings=json.dumps(all_warnings[:20]),
            analysis_completed_at=datetime.now(timezone.utc),
            model_used=settings.groq_model,
        )
        await db.commit()

        logger.info(f"Evaluation completed for submission {submission_id} with status {final_status}")

    except Exception as e:
        logger.error(f"Evaluation pipeline failed for {submission_id}: {str(e)}", exc_info=True)
        try:
            await repo.update_status(
                submission_id,
                ProcessingStatus.FAILED,
                error_message=f"Evaluation pipeline error: {str(e)}",
            )
            await db.commit()
        except Exception as inner_e:
            logger.error(f"Failed to update status for {submission_id}: {inner_e}")
