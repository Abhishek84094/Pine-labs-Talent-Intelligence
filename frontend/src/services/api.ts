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
  }): Promise<SubmissionListResponse> {
    const response = await api.get<SubmissionListResponse>('/submissions', { params });
    return response.data;
  },

  async getStats(): Promise<Stats> {
    const response = await api.get<Stats>('/submissions/stats');
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

export default api;
