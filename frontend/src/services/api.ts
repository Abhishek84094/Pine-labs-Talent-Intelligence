import axios from 'axios';
import type {
  SubmissionResponse,
  EvaluationStatus,
  SubmissionListResponse,
  Stats,
  HealthResponse,
  FullReportResponse,
  CandidateFormData,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const submissionApi = {
  async submit(
    candidateData: CandidateFormData,
    resumeFile: File,
    projectZip: File,
    onUploadProgress?: (percent: number) => void
  ): Promise<SubmissionResponse> {
    const formData = new FormData();
    formData.append('full_name', candidateData.full_name);
    formData.append('email', candidateData.email);
    formData.append('phone', candidateData.phone);
    formData.append('job_role', candidateData.job_role);
    if (candidateData.github_url) formData.append('github_url', candidateData.github_url);
    if (candidateData.linkedin_url) formData.append('linkedin_url', candidateData.linkedin_url);
    if (candidateData.portfolio_url) formData.append('portfolio_url', candidateData.portfolio_url);
    formData.append('resume', resumeFile);
    formData.append('project_zip', projectZip);

    const response = await api.post<SubmissionResponse>('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percent);
        }
      },
    });
    return response.data;
  },

  async getStatus(submissionId: string): Promise<EvaluationStatus> {
    const response = await api.get<EvaluationStatus>(`/submissions/${submissionId}/status`);
    return response.data;
  },

  async getSubmission(submissionId: string): Promise<SubmissionResponse> {
    const response = await api.get<SubmissionResponse>(`/submissions/${submissionId}`);
    return response.data;
  },

  async getReport(submissionId: string): Promise<FullReportResponse> {
    const response = await api.get<FullReportResponse>(`/submissions/${submissionId}/report`);
    return response.data;
  },

  async listSubmissions(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    review_status?: string;
  }): Promise<SubmissionListResponse> {
    const response = await api.get<SubmissionListResponse>('/submissions', { params });
    return response.data;
  },

  async getStats(): Promise<Stats> {
    const response = await api.get<Stats>('/submissions/stats');
    return response.data;
  },

  async updateReview(
    submissionId: string,
    data: {
      review_status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
      review_checklist?: Record<string, boolean | string>;
      reviewed_by?: string;
    }
  ): Promise<SubmissionResponse> {
    const response = await api.patch<SubmissionResponse>(`/submissions/${submissionId}/review`, data);
    return response.data;
  },

  async batchUpdateReview(
    submissionIds: string[],
    reviewStatus: 'pending' | 'reviewed' | 'shortlisted' | 'rejected',
    reviewedBy?: string
  ): Promise<{ success: boolean; updated_count: number; message: string }> {
    const response = await api.post('/submissions/batch-review', {
      submission_ids: submissionIds,
      review_status: reviewStatus,
      reviewed_by: reviewedBy,
    });
    return response.data;
  },

  async sendInterviewInvitation(data: {
    submission_ids: string[];
    assessment_date: string;
    technical_date: string;
    hr_date: string;
    custom_message?: string;
    subject?: string;
  }): Promise<{
    total_processed: number;
    successful_count: number;
    delivery_mode: string;
    preview_html?: string;
    message: string;
    results: any[];
  }> {
    const response = await api.post('/submissions/send-invitation', data);
    return response.data;
  },

  async deleteSubmission(submissionId: string): Promise<void> {
    await api.delete(`/submissions/${submissionId}`);
  },

  async retryEvaluation(submissionId: string): Promise<void> {
    await api.post(`/submissions/${submissionId}/retry`);
  },
};

export const healthApi = {
  async check(): Promise<HealthResponse> {
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  },
};

export const emailApi = {
  async getStatus(): Promise<{
    is_configured: boolean;
    mode: 'live_smtp' | 'simulated_demo';
    host: string | null;
    port: number;
    user: string | null;
    from_email: string;
    from_name: string;
    message: string;
  }> {
    const response = await api.get('/email/status');
    return response.data;
  },

  async updateConfig(data: {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    smtp_from_email?: string;
    smtp_from_name?: string;
  }): Promise<{ success: boolean; is_configured: boolean; message: string }> {
    const response = await api.post('/email/config', data);
    return response.data;
  },

  async sendTestEmail(recipientEmail: string): Promise<{ success: boolean; message: string; recipient: string }> {
    const response = await api.post('/email/test', { recipient_email: recipientEmail });
    return response.data;
  },
};

export default api;
