import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, CheckCircle, Search,
  Filter, RefreshCw, Trash2, ExternalLink, AlertCircle,
  FileText, CheckSquare, Square, Mail,
  Send, Sparkles, CheckCircle2,
  Award
} from 'lucide-react'
import Navbar from '../components/Navbar'
import InvitationModal from '../components/InvitationModal'
import ReviewChecklistModal from '../components/ReviewChecklistModal'
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
  const [reviewFilter, setReviewFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal states
  const [checklistCandidate, setChecklistCandidate] = useState<SubmissionListItem | null>(null)
  const [invitationCandidates, setInvitationCandidates] = useState<SubmissionListItem[] | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [subResponse, statsResponse] = await Promise.all([
        submissionApi.listSubmissions({
          search: search || undefined,
          status: statusFilter || undefined,
          review_status: reviewFilter || undefined,
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
  }, [search, statusFilter, reviewFilter])

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
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      fetchData()
    } catch (err) {
      alert('Failed to delete submission')
    }
  }

  // Selection toggle
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(submissions.map(s => s.id)))
    }
  }

  // Quick single-candidate review toggle
  const handleQuickReviewToggle = async (sub: SubmissionListItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextStatus = sub.review_status === 'reviewed' ? 'pending' : 'reviewed'
    try {
      await submissionApi.updateReview(sub.id, {
        review_status: nextStatus,
        reviewed_by: 'Hiring Team',
      })
      showSuccess(nextStatus === 'reviewed' ? `Marked ${sub.full_name} as Reviewed` : `Reverted ${sub.full_name} to Pending`)
      fetchData()
    } catch (err) {
      alert('Failed to update review status')
    }
  }

  // Batch review action
  const handleBatchMarkReviewed = async () => {
    if (selectedIds.size === 0) return
    try {
      await submissionApi.batchUpdateReview(Array.from(selectedIds), 'reviewed', 'Hiring Team')
      showSuccess(`Marked ${selectedIds.size} candidates as Reviewed`)
      setSelectedIds(new Set())
      fetchData()
    } catch (err) {
      alert('Failed to update candidates')
    }
  }

  // Batch shortlist invitation action
  const handleBatchInvite = () => {
    const selected = submissions.filter(s => selectedIds.has(s.id))
    if (selected.length === 0) return
    setInvitationCandidates(selected)
  }

  const showSuccess = (msg: string) => {
    setActionSuccessMessage(msg)
    setTimeout(() => setActionSuccessMessage(''), 4000)
  }

  return (
    <div className="min-h-screen bg-pine-cream pb-24">
      <Navbar variant="dashboard" />

      {/* Page header */}
      <div className="bg-pine-forest-deep text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-2 text-pine-lime text-xs font-semibold mb-2 uppercase tracking-widest">
            <div className="w-4 h-px bg-pine-lime" />
            Hiring Team Portal
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Talent Intelligence Dashboard</h1>
              <p className="text-white/60 text-xs sm:text-sm mt-1">
                Review candidate evaluations, tick review checklists, and shortlist for interview rounds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/submit" className="btn-primary text-xs flex items-center gap-1.5 shadow-sm">
                + New Application
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Success Alert Banner */}
        {actionSuccessMessage && (
          <div className="p-4 bg-pine-lime/20 border border-pine-lime text-pine-forest rounded-xl flex items-center gap-3 mb-6 animate-fade-in shadow-xs">
            <CheckCircle2 size={18} className="text-pine-forest flex-shrink-0" />
            <p className="text-sm font-semibold">{actionSuccessMessage}</p>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { label: 'Total Submissions', value: stats.total, icon: Users, color: 'text-pine-forest' },
              { label: 'Evaluations Completed', value: stats.completed, icon: CheckCircle, color: 'text-pine-forest' },
              { label: 'Reviewed by Team', value: stats.reviewed ?? 0, icon: CheckSquare, color: 'text-blue-600' },
              { label: 'Shortlisted for Next Round', value: stats.shortlisted ?? 0, icon: Award, color: 'text-emerald-700' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-3.5 sm:p-5 flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pine-cream flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className={`sm:w-5 sm:h-5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-pine-forest leading-tight">{value}</p>
                  <p className="text-[11px] sm:text-xs text-pine-slate-light font-medium mt-0.5 leading-snug">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="card p-4 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
            <input
              type="text"
              placeholder="Search by candidate name, email, or reference ID..."
              className="input-field pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            {/* Review Status Filter */}
            <div className="relative w-full sm:w-44">
              <CheckSquare size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
              <select
                className="input-field pl-10 pr-8 w-full text-xs"
                value={reviewFilter}
                onChange={e => setReviewFilter(e.target.value)}
              >
                <option value="">All Review Statuses</option>
                <option value="pending">Needs Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Evaluation Status Filter */}
            <div className="relative w-full sm:w-40">
              <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
              <select
                className="input-field pl-10 pr-8 w-full text-xs"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Evaluations</option>
                <option value="completed">Completed</option>
                <option value="queued">Queued</option>
                <option value="analyzing_resume">Analyzing</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <button onClick={fetchData} className="btn-secondary flex-shrink-0 text-xs" title="Refresh">
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 mb-4">
            <AlertCircle size={16} className="text-status-error" />
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        {/* Candidates Table */}
        <div className="card overflow-hidden shadow-sm">
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
              <h3 className="text-lg font-bold text-pine-forest">No submissions found</h3>
              <p className="text-sm text-pine-slate-light mt-2 max-w-md mx-auto">
                No candidate applications match your current filters. Clear filters or submit a new application.
              </p>
              <Link to="/submit" className="btn-primary mt-6 inline-flex">
                Open Application Form
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile scroll hint */}
              <div className="md:hidden px-4 py-2 bg-pine-cream/70 text-[11px] text-pine-slate border-b border-pine-border flex items-center justify-between">
                <span>Swipe table sideways to view checklist & actions</span>
                <span className="text-xs">👉</span>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[660px]">
                  <thead>
                    <tr className="border-b border-pine-border bg-pine-cream/70 text-left">
                      {/* Checkbox select all */}
                      <th className="w-10 px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-pine-forest hover:text-pine-slate focus:outline-hidden"
                          title="Select / Deselect all"
                        >
                          {selectedIds.size > 0 && selectedIds.size === submissions.length ? (
                            <div className="w-4 h-4 rounded bg-pine-forest text-pine-lime flex items-center justify-center mx-auto">
                              <CheckCircle2 size={14} />
                            </div>
                          ) : selectedIds.size > 0 ? (
                            <div className="w-4 h-4 rounded bg-pine-forest text-pine-lime flex items-center justify-center mx-auto text-[10px] font-bold">
                              -
                            </div>
                          ) : (
                            <Square size={16} className="text-pine-slate-light mx-auto" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-xs font-bold text-pine-slate-light uppercase tracking-wider">Candidate</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-pine-slate-light uppercase tracking-wider hidden md:table-cell">Job Role</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-pine-slate-light uppercase tracking-wider">AI Evaluation</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-pine-slate-light uppercase tracking-wider">Hiring Review</th>
                      <th className="text-right px-6 py-3.5 text-xs font-bold text-pine-slate-light uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => {
                      const isSelected = selectedIds.has(sub.id)
                      const isReviewed = sub.review_status === 'reviewed' || sub.review_status === 'shortlisted'
                      const isShortlisted = sub.review_status === 'shortlisted'

                      return (
                        <tr
                          key={sub.id}
                          className={`border-b border-pine-border last:border-0 transition-colors cursor-pointer ${
                            isSelected ? 'bg-pine-lime/10' : 'hover:bg-pine-cream/60'
                          }`}
                          onClick={() => navigate(`/report/${sub.id}`)}
                        >
                          {/* Row selection checkbox */}
                          <td className="w-10 px-4 py-4 text-center" onClick={e => toggleSelect(sub.id, e)}>
                            <button
                              type="button"
                              className="text-pine-forest hover:text-pine-slate focus:outline-hidden"
                            >
                              {isSelected ? (
                                <div className="w-4 h-4 rounded bg-pine-forest text-pine-lime flex items-center justify-center mx-auto">
                                  <CheckCircle2 size={14} />
                                </div>
                              ) : (
                                <Square size={16} className="text-pine-slate-light mx-auto" />
                              )}
                            </button>
                          </td>

                          {/* Candidate info */}
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-bold text-pine-forest flex items-center gap-2">
                                {sub.full_name}
                                {sub.email_sent && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-sm" title="Shortlist invitation email sent">
                                    <Mail size={10} /> Invited
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-pine-slate-light">{sub.email}</p>
                              <p className="text-[11px] font-mono text-pine-slate-light/80 mt-0.5">{sub.reference_id}</p>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-4 hidden md:table-cell">
                            <p className="text-sm font-medium text-pine-forest">{sub.job_role}</p>
                            <p className="text-[11px] text-pine-slate-light">{formatDate(sub.submitted_at)}</p>
                          </td>

                          {/* AI Evaluation Status */}
                          <td className="px-4 py-4">
                            <span className={`badge ${STATUS_COLORS[sub.status as ProcessingStatus] || 'badge-pending'}`}>
                              {STATUS_LABELS[sub.status as ProcessingStatus] || sub.status}
                            </span>
                          </td>

                          {/* Review Checklist Status */}
                          <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {/* Quick toggle button */}
                              <button
                                type="button"
                                onClick={(e) => handleQuickReviewToggle(sub, e)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                  isReviewed
                                    ? 'bg-pine-forest text-pine-lime'
                                    : 'border border-pine-border text-pine-slate-light hover:border-pine-forest'
                                }`}
                                title={isReviewed ? 'Marked as Reviewed (Click to revert)' : 'Click to mark as Reviewed'}
                              >
                                {isReviewed ? <CheckCircle2 size={16} /> : <Square size={16} />}
                              </button>

                              {/* Review badge & checklist trigger */}
                              <button
                                type="button"
                                onClick={() => setChecklistCandidate(sub)}
                                className="text-left group"
                                title="Open Review Checklist"
                              >
                                {isShortlisted ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-pine-lime text-pine-forest group-hover:underline">
                                    <Sparkles size={11} /> Shortlisted
                                  </span>
                                ) : sub.review_status === 'reviewed' ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 group-hover:underline">
                                    <CheckCircle size={11} /> Reviewed
                                  </span>
                                ) : sub.review_status === 'rejected' ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800 group-hover:underline">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                                    Needs Review
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              {/* Checklist button */}
                              <button
                                type="button"
                                onClick={() => setChecklistCandidate(sub)}
                                className="btn-ghost text-xs py-1 px-2 text-pine-forest hover:bg-pine-cream"
                                title="Review Checklist"
                              >
                                <CheckSquare size={13} />
                                <span className="hidden lg:inline">Checklist</span>
                              </button>

                              {/* Invite / Shortlist single candidate */}
                              <button
                                type="button"
                                onClick={() => setInvitationCandidates([sub])}
                                className="btn-ghost text-xs py-1 px-2 text-pine-forest hover:bg-pine-lime/30"
                                title="Send Shortlist Email"
                              >
                                <Mail size={13} />
                                <span className="hidden lg:inline">Send Mail</span>
                              </button>

                              {/* View Report */}
                              {(sub.status === 'completed' || sub.status === 'partial') && (
                                <Link
                                  to={`/report/${sub.id}`}
                                  className="btn-ghost text-xs py-1 px-2"
                                  title="View full report"
                                >
                                  <ExternalLink size={13} />
                                  <span className="hidden sm:inline">Report</span>
                                </Link>
                              )}

                              {/* Delete */}
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
                                  className="btn-ghost text-xs py-1 px-1.5 text-status-error"
                                  title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-6 py-3 border-t border-pine-border flex items-center justify-between bg-pine-cream/40">
                <p className="text-xs text-pine-slate-light">
                  Showing {submissions.length} of {total} candidates
                </p>
                {loading && <div className="spinner w-4 h-4" />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 inset-x-0 mx-auto max-w-2xl px-3 sm:px-4 z-40 animate-slide-up">
          <div className="bg-pine-forest-deep text-white rounded-2xl shadow-2xl p-3 sm:p-4 border border-pine-lime/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pine-lime text-pine-forest font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {selectedIds.size}
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">
                    {selectedIds.size} candidate{selectedIds.size > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-white/60 hidden sm:block">
                    Perform bulk hiring decisions or send invitation emails
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-white/60 hover:text-white sm:hidden px-2 py-1"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBatchMarkReviewed}
                className="btn-secondary text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3"
              >
                <CheckSquare size={13} />
                <span className="hidden sm:inline">Mark</span> Reviewed
              </button>
              <button
                type="button"
                onClick={handleBatchInvite}
                className="btn-primary text-xs bg-pine-lime text-pine-forest hover:bg-lime-400 font-bold flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 shadow-sm"
              >
                <Send size={13} />
                Shortlist & Invite
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-white/50 hover:text-white ml-1 hidden sm:inline-block"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-pine-forest">Delete Submission</h3>
            <p className="text-sm text-pine-slate-light mt-2">
              This will permanently delete the submission and all associated evaluation reports. This action cannot be undone.
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

      {/* Checklist Modal */}
      {checklistCandidate && (
        <ReviewChecklistModal
          candidate={checklistCandidate}
          onClose={() => setChecklistCandidate(null)}
          onSuccess={() => {
            showSuccess(`Review checklist saved for ${checklistCandidate.full_name}`)
            fetchData()
          }}
          onOpenInvitation={(cand) => {
            setChecklistCandidate(null)
            setInvitationCandidates([cand])
          }}
        />
      )}

      {/* Interview Invitation Modal */}
      {invitationCandidates && invitationCandidates.length > 0 && (
        <InvitationModal
          candidates={invitationCandidates}
          onClose={() => setInvitationCandidates(null)}
          onSuccess={() => {
            showSuccess(`Shortlist email invitations sent!`)
            setSelectedIds(new Set())
            fetchData()
          }}
        />
      )}
    </div>
  )
}

