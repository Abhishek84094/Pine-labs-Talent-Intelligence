"""Pydantic schemas for evaluation output"""
from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INSUFFICIENT = "insufficient"


class EvidenceItem(BaseModel):
    claim: str
    source: str  # file or section name
    excerpt: Optional[str] = None
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM


class ResumeExperience(BaseModel):
    title: str
    organization: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    technologies: list[str] = Field(default_factory=list)
    is_internship: bool = False
    supporting_text: Optional[str] = None


class ResumeProject(BaseModel):
    title: str
    description: Optional[str] = None
    technologies: list[str] = Field(default_factory=list)
    url: Optional[str] = None
    dates: Optional[str] = None
    supporting_text: Optional[str] = None


class EducationRecord(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None


class ResumeAnalysis(BaseModel):
    candidate_name: Optional[str] = None
    professional_summary: Optional[str] = None
    education: list[EducationRecord] = Field(default_factory=list)
    work_experience: list[ResumeExperience] = Field(default_factory=list)
    internships: list[ResumeExperience] = Field(default_factory=list)
    technical_skills: list[str] = Field(default_factory=list)
    programming_languages: list[str] = Field(default_factory=list)
    frameworks_and_libraries: list[str] = Field(default_factory=list)
    tools_and_platforms: list[str] = Field(default_factory=list)
    projects: list[ResumeProject] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    relevant_highlights: list[str] = Field(default_factory=list)
    claims_needing_verification: list[str] = Field(default_factory=list)
    extraction_warnings: list[str] = Field(default_factory=list)
    evidence_snippets: list[EvidenceItem] = Field(default_factory=list)


class InspectedFile(BaseModel):
    path: str
    size_bytes: int
    extension: str
    was_analyzed: bool
    skip_reason: Optional[str] = None
    content_excerpt: Optional[str] = None


class ProjectInventory(BaseModel):
    total_files: int
    total_size_bytes: int
    top_level_folders: list[str]
    file_extensions: dict[str, int]  # ext -> count
    readme_files: list[str]
    dependency_manifests: list[str]
    source_files: list[str]
    test_files: list[str]
    config_files: list[str]
    ci_cd_files: list[str]
    docker_files: list[str]
    sensitive_files_excluded: list[str]
    inspected_files: list[InspectedFile]
    skipped_files: list[InspectedFile]
    detected_ecosystems: list[str]
    warnings: list[str]


class TechnicalObservation(BaseModel):
    category: str  # e.g., "Architecture", "Testing", "Security"
    observation: str
    evidence: list[EvidenceItem] = Field(default_factory=list)
    is_positive: bool = True
    severity: Optional[str] = None  # "info", "concern", "issue"


class RubricAssessment(BaseModel):
    dimension: str
    description: str
    score: Optional[float] = None  # 0-10, None if not assessable
    max_score: float = 10.0
    evidence: list[str] = Field(default_factory=list)
    missing_evidence: list[str] = Field(default_factory=list)
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    notes: Optional[str] = None


class InterviewQuestion(BaseModel):
    question: str
    relevance: str
    evidence_or_uncertainty: str
    strong_answer_demonstrates: str


class ConsistencyCheck(BaseModel):
    item: str  # technology or claim
    in_resume: bool
    in_project: bool
    notes: Optional[str] = None
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM


class ProjectAnalysis(BaseModel):
    project_title: Optional[str] = None
    description: Optional[str] = None
    problem_addressed: Optional[str] = None
    intended_users: Optional[str] = None
    main_functionality: list[str] = Field(default_factory=list)
    architecture_overview: Optional[str] = None
    frontend_technologies: list[str] = Field(default_factory=list)
    backend_technologies: list[str] = Field(default_factory=list)
    databases_and_services: list[str] = Field(default_factory=list)
    ai_ml_components: list[str] = Field(default_factory=list)
    apis_and_integrations: list[str] = Field(default_factory=list)
    data_flow: Optional[str] = None
    testing_approach: Optional[str] = None
    error_handling_observations: Optional[str] = None
    security_observations: Optional[str] = None
    code_organization: Optional[str] = None
    documentation_quality: Optional[str] = None
    deployment_readiness: Optional[str] = None
    potential_limitations: list[str] = Field(default_factory=list)
    missing_evidence: list[str] = Field(default_factory=list)
    supporting_files: list[str] = Field(default_factory=list)
    evidence_excerpts: list[EvidenceItem] = Field(default_factory=list)
    interview_clarifications: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class CandidateEvaluationReport(BaseModel):
    submission_id: str
    candidate_name: str
    job_role: str
    executive_summary: str
    resume_overview: str
    project_overview: str
    technical_observations: list[TechnicalObservation] = Field(default_factory=list)
    strengths: list[EvidenceItem] = Field(default_factory=list)
    potential_concerns: list[TechnicalObservation] = Field(default_factory=list)
    consistency_checks: list[ConsistencyCheck] = Field(default_factory=list)
    interview_questions: list[InterviewQuestion] = Field(default_factory=list)
    rubric_assessments: list[RubricAssessment] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    hiring_team_takeaway: str
    resume_analysis: Optional[ResumeAnalysis] = None
    project_analysis: Optional[ProjectAnalysis] = None
    processing_metadata: dict[str, Any] = Field(default_factory=dict)


class EvaluationJobStatus(BaseModel):
    submission_id: str
    reference_id: str
    status: str
    stage_message: Optional[str] = None
    error_message: Optional[str] = None
    report_available: bool = False
    submitted_at: Optional[str] = None
    completed_at: Optional[str] = None
