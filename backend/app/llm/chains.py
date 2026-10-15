"""LangChain chains for resume and project analysis"""
import json
import re
import time
import logging
from typing import Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.llm.groq_client import get_groq_chat_model
from app.llm.prompts import (
    resume_analysis_prompt,
    project_analysis_prompt,
    report_synthesis_prompt,
)
from app.api.schemas.evaluation import (
    ResumeAnalysis,
    ProjectAnalysis,
    CandidateEvaluationReport,
)
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def extract_json_from_response(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks and repair"""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON between first { and last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    # Try json_repair for truncated or slightly malformed JSON
    try:
        import json_repair
        repaired = json_repair.repair_json(text, return_objects=True)
        if isinstance(repaired, dict):
            return repaired
    except Exception:
        pass

    raise ValueError(f"Could not extract valid JSON from response. First 200 chars: {text[:200]}")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type((Exception,)),
    reraise=True,
)
def _call_llm_with_retry(chain, inputs: dict) -> str:
    """Call LLM with retry logic"""
    response = chain.invoke(inputs)
    if hasattr(response, "content"):
        return response.content
    return str(response)


def analyze_resume(resume_text: str) -> tuple[ResumeAnalysis, list[str]]:
    """
    Run resume analysis via LangChain + Groq.
    Returns (ResumeAnalysis, warnings)
    """
    warnings = []

    if not resume_text or len(resume_text.strip()) < 50:
        warnings.append("Resume text is too short or empty. Analysis quality will be limited.")
        return ResumeAnalysis(
            extraction_warnings=warnings
        ), warnings

    try:
        llm = get_groq_chat_model(temperature=0.1)
        chain = resume_analysis_prompt | llm

        raw_response = _call_llm_with_retry(chain, {"resume_text": resume_text})
        parsed = extract_json_from_response(raw_response)

        # Validate with Pydantic
        analysis = ResumeAnalysis(**parsed)

        # Add any extraction warnings from the LLM
        if analysis.extraction_warnings:
            warnings.extend(analysis.extraction_warnings)

        return analysis, warnings

    except ValueError as e:
        err_str = str(e)
        msg = f"Groq API not configured: {err_str}" if "not configured" in err_str.lower() else f"Resume extraction error: {err_str}"
        logger.error(msg)
        warnings.append(msg)
        return ResumeAnalysis(extraction_warnings=[msg]), warnings

    except Exception as e:
        msg = f"Resume analysis failed: {str(e)}"
        logger.error(msg, exc_info=True)
        warnings.append(msg)
        return ResumeAnalysis(extraction_warnings=[msg]), warnings


def analyze_project(
    inventory_summary: str,
    file_contents: list[tuple[str, str]],
) -> tuple[ProjectAnalysis, list[str]]:
    """
    Run project analysis via LangChain + Groq.
    Returns (ProjectAnalysis, warnings)
    """
    warnings = []

    if not file_contents:
        warnings.append("No project files could be analyzed. Analysis quality will be very limited.")

    # Format file contents for prompt
    formatted_files = []
    for path, content in file_contents:
        formatted_files.append(f"=== FILE: {path} ===\n{content}\n")

    file_contents_str = "\n".join(formatted_files) if formatted_files else "(No analyzable files found)"

    # Truncate if needed
    if len(file_contents_str) > settings.max_project_context_chars:
        file_contents_str = file_contents_str[:settings.max_project_context_chars] + "\n... [truncated]"
        warnings.append("Project file contents were truncated to fit context limits.")

    try:
        llm = get_groq_chat_model(temperature=0.1)
        chain = project_analysis_prompt | llm

        raw_response = _call_llm_with_retry(chain, {
            "inventory_summary": inventory_summary,
            "file_contents": file_contents_str,
        })

        parsed = extract_json_from_response(raw_response)
        analysis = ProjectAnalysis(**parsed)

        if analysis.warnings:
            warnings.extend(analysis.warnings)

        return analysis, warnings

    except ValueError as e:
        err_str = str(e)
        msg = f"Groq API not configured: {err_str}" if "not configured" in err_str.lower() else f"Project analysis error: {err_str}"
        logger.error(msg)
        warnings.append(msg)
        return ProjectAnalysis(warnings=[msg]), warnings

    except Exception as e:
        msg = f"Project analysis failed: {str(e)}"
        logger.error(msg, exc_info=True)
        warnings.append(msg)
        return ProjectAnalysis(warnings=[msg]), warnings


def synthesize_report(
    candidate_name: str,
    job_role: str,
    submission_id: str,
    resume_analysis: ResumeAnalysis,
    project_analysis: ProjectAnalysis,
    inventory_summary: str,
) -> tuple[CandidateEvaluationReport, list[str]]:
    """
    Synthesize the final evaluation report.
    Returns (CandidateEvaluationReport, warnings)
    """
    warnings = []

    try:
        llm = get_groq_chat_model(temperature=0.2)
        chain = report_synthesis_prompt | llm

        raw_response = _call_llm_with_retry(chain, {
            "candidate_name": candidate_name,
            "job_role": job_role,
            "resume_analysis": resume_analysis.model_dump_json(indent=2),
            "project_analysis": project_analysis.model_dump_json(indent=2),
            "inventory_summary": inventory_summary,
        })

        parsed = extract_json_from_response(raw_response)

        # Build full report
        report = CandidateEvaluationReport(
            submission_id=submission_id,
            candidate_name=candidate_name,
            job_role=job_role,
            executive_summary=parsed.get("executive_summary", "Executive summary not available."),
            resume_overview=parsed.get("resume_overview", ""),
            project_overview=parsed.get("project_overview", ""),
            technical_observations=parsed.get("technical_observations", []),
            strengths=parsed.get("strengths", []),
            potential_concerns=parsed.get("potential_concerns", []),
            consistency_checks=parsed.get("consistency_checks", []),
            interview_questions=parsed.get("interview_questions", []),
            rubric_assessments=parsed.get("rubric_assessments", []),
            limitations=parsed.get("limitations", []),
            hiring_team_takeaway=parsed.get("hiring_team_takeaway", ""),
            resume_analysis=resume_analysis,
            project_analysis=project_analysis,
            processing_metadata={
                "model_used": settings.groq_model,
                "status": "completed",
            },
        )

        return report, warnings

    except ValueError as e:
        err_str = str(e)
        msg = f"Groq API not configured: {err_str}" if "not configured" in err_str.lower() else f"Report synthesis error: {err_str}"
        logger.error(msg)
        warnings.append(msg)
    except Exception as e:
        msg = f"Report synthesis failed: {str(e)}"
        logger.error(msg, exc_info=True)
        warnings.append(msg)

    # Fallback report
    fallback = CandidateEvaluationReport(
        submission_id=submission_id,
        candidate_name=candidate_name,
        job_role=job_role,
        executive_summary=f"Evaluation for {candidate_name} could not be fully synthesized. Resume and project analyses are available separately.",
        resume_overview=resume_analysis.professional_summary or "See resume analysis.",
        project_overview=project_analysis.description or "See project analysis.",
        limitations=["Report synthesis failed: " + (warnings[-1] if warnings else "Unknown error")],
        hiring_team_takeaway="Manual review required due to synthesis failure.",
        resume_analysis=resume_analysis,
        project_analysis=project_analysis,
        processing_metadata={"status": "partial", "warnings": warnings},
    )

    return fallback, warnings
