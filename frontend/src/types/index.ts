// API Types matching backend schemas

export interface SubmissionResponse {
  id: string;
  reference_id: string;
  full_name: string;
  email: string;
  phone: string;
  job_role: string;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  resume_filename: string;
  resume_file_size: number;
  project_filename: string;
  project_file_size: number;
  status: ProcessingStatus;
  error_message: string | null;
  review_status?: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  review_checklist?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  email_sent?: boolean;
  email_sent_at?: string | null;
  interview_details?: string | null;
  submitted_at: string;
  updated_at: string;
}

export type ProcessingStatus =
  | 'uploaded'
  | 'validating'
  | 'queued'
  | 'analyzing_resume'
  | 'analyzing_project'
  | 'synthesizing_report'
  | 'completed'
  | 'partial'
  | 'failed';

export interface EvaluationStatus {
  submission_id: string;
  reference_id: string;
  status: ProcessingStatus;
  stage_message: string;
  error_message: string | null;
  report_available: boolean;
  submitted_at: string | null;
  completed_at: string | null;
}

export interface SubmissionListItem {
  id: string;
  reference_id: string;
  full_name: string;
  email: string;
  job_role: string;
  status: ProcessingStatus;
  review_status?: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  review_checklist?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  email_sent?: boolean;
  email_sent_at?: string | null;
  interview_details?: string | null;
  submitted_at: string;
  resume_filename: string;
  project_filename: string;
}

export interface SubmissionListResponse {
  submissions: SubmissionListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface Stats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  reviewed?: number;
  shortlisted?: number;
}

export interface ReviewUpdateRequest {
  review_status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  review_checklist?: Record<string, boolean | string>;
  reviewed_by?: string;
}

export interface BatchReviewRequest {
  submission_ids: string[];
  review_status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  reviewed_by?: string;
}

export interface InterviewInvitationRequest {
  submission_ids: string[];
  assessment_date: string;
  technical_date: string;
  hr_date: string;
  custom_message?: string;
  subject?: string;
}

export interface InterviewInvitationResponse {
  total_processed: number;
  successful_count: number;
  delivery_mode: string;
  results: Array<{
    submission_id: string;
    candidate_name: string;
    email: string;
    role: string;
    success: boolean;
    delivery_mode?: string;
    message?: string;
  }>;
  preview_html?: string;
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  groq_configured: boolean;
  database: string;
}

// Report types
export interface EvidenceItem {
  claim: string;
  source: string;
  excerpt: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface ResumeExperience {
  title: string;
  organization: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  technologies: string[];
  is_internship: boolean;
  supporting_text: string | null;
}

export interface ResumeProject {
  title: string;
  description: string | null;
  technologies: string[];
  url: string | null;
  dates: string | null;
  supporting_text: string | null;
}

export interface EducationRecord {
  degree: string | null;
  institution: string | null;
  field_of_study: string | null;
  graduation_year: string | null;
  gpa: string | null;
}

export interface ResumeAnalysis {
  candidate_name: string | null;
  professional_summary: string | null;
  education: EducationRecord[];
  work_experience: ResumeExperience[];
  internships: ResumeExperience[];
  technical_skills: string[];
  programming_languages: string[];
  frameworks_and_libraries: string[];
  tools_and_platforms: string[];
  projects: ResumeProject[];
  certifications: string[];
  relevant_highlights: string[];
  claims_needing_verification: string[];
  extraction_warnings: string[];
  evidence_snippets: EvidenceItem[];
}

export interface ProjectAnalysis {
  project_title: string | null;
  description: string | null;
  problem_addressed: string | null;
  intended_users: string | null;
  main_functionality: string[];
  architecture_overview: string | null;
  frontend_technologies: string[];
  backend_technologies: string[];
  databases_and_services: string[];
  ai_ml_components: string[];
  apis_and_integrations: string[];
  data_flow: string | null;
  testing_approach: string | null;
  error_handling_observations: string | null;
  security_observations: string | null;
  code_organization: string | null;
  documentation_quality: string | null;
  deployment_readiness: string | null;
  potential_limitations: string[];
  missing_evidence: string[];
  supporting_files: string[];
  evidence_excerpts: EvidenceItem[];
  interview_clarifications: string[];
  warnings: string[];
}

export interface TechnicalObservation {
  category: string;
  observation: string;
  evidence: EvidenceItem[];
  is_positive: boolean;
  severity: string | null;
}

export interface RubricAssessment {
  dimension: string;
  description: string;
  score: number | null;
  max_score: number;
  evidence: string[];
  missing_evidence: string[];
  confidence: string;
  notes: string | null;
}

export interface InterviewQuestion {
  question: string;
  relevance: string;
  evidence_or_uncertainty: string;
  strong_answer_demonstrates: string;
}

export interface ConsistencyCheck {
  item: string;
  in_resume: boolean;
  in_project: boolean;
  notes: string | null;
  confidence: string;
}

export interface EvaluationReport {
  submission_id: string;
  candidate_name: string;
  job_role: string;
  executive_summary: string;
  resume_overview: string;
  project_overview: string;
  technical_observations: TechnicalObservation[];
  strengths: EvidenceItem[];
  potential_concerns: TechnicalObservation[];
  consistency_checks: ConsistencyCheck[];
  interview_questions: InterviewQuestion[];
  rubric_assessments: RubricAssessment[];
  limitations: string[];
  hiring_team_takeaway: string;
  resume_analysis: ResumeAnalysis | null;
  project_analysis: ProjectAnalysis | null;
  processing_metadata: Record<string, unknown>;
}

export interface FullReportResponse {
  submission_id: string;
  reference_id: string;
  candidate: {
    name: string;
    email: string;
    role: string;
    github_url: string | null;
    linkedin_url: string | null;
    portfolio_url: string | null;
  };
  status: ProcessingStatus;
  submitted_at: string | null;
  completed_at: string | null;
  warnings: string[];
  report: EvaluationReport;
  resume_analysis: ResumeAnalysis | null;
  project_analysis: ProjectAnalysis | null;
}

// Form types
export interface CandidateFormData {
  full_name: string;
  email: string;
  phone: string;
  job_role: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}
