import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart2, Users, Clock, CheckCircle, XCircle, Search,
  Filter, RefreshCw, Trash2, ExternalLink, AlertCircle,
  ChevronRight, FileText,
} from 'lucide-react'
import Header from '../components/Header'
import { submissionApi } from '../services/api'
import type { SubmissionListItem, Stats, ProcessingStatus } from '../types'

const STATUS_COLORS: Record<ProcessingStatus, string> = {
  uploaded: 'badge-pending',
  validating: 'badge-pending',
  queued: 'badge-pending',
  analyzing_resume: 'badge-info',
  analyzing_project: 'badge-info',
  synthesizing_report: 'badge-info',
  completed: 'badge-green',
  partial: 'badge-warning',
  failed: 'badge-error',
}

const STATUS_LABELS: Record<ProcessingStatus, string> = {
  uploaded: 'Uploaded',
  validating: 'Validating',
  queued: 'Queued',
  analyzing_resume: 'Analyzing Resume',
  analyzing_project: 'Analyzing Project',
  synthesizing_report: 'Preparing Report',
  completed: 'Completed',
  partial: 'Partial',
  failed: 'Failed',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [subResponse, statsResponse] = await Promise.all([
        submissionApi.listSubmissions({
          search: search || undefined,
          status: statusFilter || undefined,
        }),
        submissionApi.getStats(),
      ])
      setSubmissions(subResponse.submissions)
      setTotal(subResponse.total)
      setStats(statsResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [search, statusFilter])

  // Auto-refresh every 10s if there are in-progress evaluations
  useEffect(() => {
    const hasInProgress = submissions.some(
      s => !['completed', 'partial', 'failed'].includes(s.status)
    )
    if (!hasInProgress) return

    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [submissions])

  const handleDelete = async (id: string) => {
    try {
      await submissionApi.deleteSubmission(id)
      setDeleteId(null)
      fetchData()
    } catch (err) {
      alert('Failed to delete submission')
    }
  }

  const handleRetry = async (id: string) => {
    setRetryingId(id)
    try {
      await submissionApi.retryEvaluation(id)
      setTimeout(fetchData, 1000)
    } catch (err) {
      alert('Failed to retry evaluation')
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-pine-cream">
      <Header showSubmitLink />

      {/* Page header */}
      <div className="bg-pine-navy text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-white">Hiring Dashboard</h1>
          <p className="text-pine-slate-light text-sm mt-1">
            Review candidate applications and AI-generated evaluations
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Submissions', value: stats.total, icon: Users, color: 'text-pine-navy' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-status-pending' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-pine-green' },
              { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-status-error' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="stat-card">
                <div className={`w-10 h-10 rounded-xl bg-pine-cream flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-pine-navy">{value}</p>
                  <p className="text-xs text-pine-slate-light font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
            <input
              type="text"
              placeholder="Search by name, email, or reference ID..."
              className="input-field pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
            <select
              className="input-field pl-10 pr-8 w-full sm:w-48"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="analyzing_resume">Analyzing</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button onClick={fetchData} className="btn-secondary flex-shrink-0" title="Refresh">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 mb-4">
            <AlertCircle size={16} className="text-status-error" />
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          {loading && !submissions.length ? (
            <div className="flex items-center justify-center py-20">
              <div className="spinner w-8 h-8" />
            </div>
          ) : submissions.length === 0 ? (
            /* Empty state */
            <div className="py-20 text-center px-6">
              <div className="w-16 h-16 bg-pine-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-pine-slate-light" />
              </div>
              <h3 className="text-lg font-bold text-pine-navy">No submissions yet</h3>
              <p className="text-sm text-pine-slate-light mt-2 max-w-md mx-auto">
                When candidates submit their applications through the submission portal, they'll
                appear here with their AI-generated evaluation reports.
              </p>
              <Link to="/" className="btn-primary mt-6 inline-flex">
                Open Submission Portal
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-pine-border bg-pine-cream">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-pine-slate-light uppercase tracking-wider">Candidate</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-pine-slate-light uppercase tracking-wider hidden sm:table-cell">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-pine-slate-light uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-pine-slate-light uppercase tracking-wider hidden md:table-cell">Submitted</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-pine-slate-light uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr
                        key={sub.id}
                        className="border-b border-pine-border last:border-0 hover:bg-pine-cream transition-colors cursor-pointer"
                        onClick={() => navigate(`/report/${sub.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-pine-navy">{sub.full_name}</p>
                            <p className="text-xs text-pine-slate-light">{sub.email}</p>
                            <p className="text-xs font-mono text-pine-slate-light mt-0.5">{sub.reference_id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <p className="text-sm text-pine-navy">{sub.job_role}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`badge ${STATUS_COLORS[sub.status as ProcessingStatus] || 'badge-pending'}`}>
                            {STATUS_LABELS[sub.status as ProcessingStatus] || sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-xs text-pine-slate-light">{formatDate(sub.submitted_at)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                            {(sub.status === 'completed' || sub.status === 'partial') && (
                              <Link
                                to={`/report/${sub.id}`}
                                className="btn-ghost text-xs py-1 px-2"
                                title="View report"
                              >
                                <ExternalLink size={13} />
                                Report
                              </Link>
                            )}
                            {(sub.status === 'failed' || sub.status === 'partial') && (
                              <button
                                onClick={() => handleRetry(sub.id)}
                                className="btn-ghost text-xs py-1 px-2"
                                disabled={retryingId === sub.id}
                                title="Retry evaluation"
                              >
                                <RefreshCw size={13} className={retryingId === sub.id ? 'animate-spin' : ''} />
                                Retry
                              </button>
                            )}
                            {deleteId === sub.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(sub.id)}
                                  className="text-xs text-status-error font-semibold hover:underline"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteId(null)}
                                  className="text-xs text-pine-slate-light hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteId(sub.id)}
                                className="btn-ghost text-xs py-1 px-2 text-status-error"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-pine-border flex items-center justify-between">
                <p className="text-xs text-pine-slate-light">
                  Showing {submissions.length} of {total} submissions
                </p>
                {loading && <div className="spinner w-4 h-4" />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-pine-navy">Delete Submission</h3>
            <p className="text-sm text-pine-slate-light mt-2">
              This will permanently delete the submission and all associated files. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-primary flex-1 bg-status-error hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
