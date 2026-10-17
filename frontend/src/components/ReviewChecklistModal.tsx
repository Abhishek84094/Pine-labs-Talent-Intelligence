import { useState } from 'react'
import {
  CheckSquare, Square, CheckCircle2, UserCheck, X,
  Save, AlertCircle, FileText, Code, Shield, HelpCircle,
  ArrowRight
} from 'lucide-react'
import { submissionApi } from '../services/api'
import type { SubmissionListItem } from '../types'

interface ReviewChecklistModalProps {
  candidate: SubmissionListItem
  onClose: () => void
  onSuccess: (updatedSub?: any) => void
  onOpenInvitation?: (candidate: SubmissionListItem) => void
}

interface ChecklistItem {
  id: string
  label: string
  desc: string
  icon: typeof FileText
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'summary_reviewed',
    label: '1. Executive Summary & Fit Reviewed',
    desc: 'Candidate role alignment, key achievements, and hiring recommendation analyzed.',
    icon: FileText,
  },
  {
    id: 'skills_verified',
    label: '2. Resume & Technical Skills Verified',
    desc: 'Core programming languages, frameworks, work experience, and credentials checked.',
    icon: UserCheck,
  },
  {
    id: 'code_quality_checked',
    label: '3. Project Architecture & Code Quality Inspected',
    desc: 'Static code analysis, rubric scores, testing coverage, and design patterns reviewed.',
    icon: Code,
  },
  {
    id: 'consistency_verified',
    label: '4. Consistency & Originality Checks Cleared',
    desc: 'Verification between claimed resume skills and actual repository codebase evidence.',
    icon: Shield,
  },
  {
    id: 'interview_questions_prepped',
    label: '5. Interview Clarification Questions Prepared',
    desc: 'AI-generated probing questions reviewed for the technical interview round.',
    icon: HelpCircle,
  },
]

export default function ReviewChecklistModal({
  candidate,
  onClose,
  onSuccess,
  onOpenInvitation,
}: ReviewChecklistModalProps) {
  // Parse existing checklist if available
  let existingChecklist: Record<string, boolean> = {}
  try {
    if (candidate.review_checklist) {
      existingChecklist = JSON.parse(candidate.review_checklist)
    }
  } catch (e) {
    existingChecklist = {}
  }

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    summary_reviewed: existingChecklist.summary_reviewed ?? (candidate.review_status === 'reviewed' || candidate.review_status === 'shortlisted'),
    skills_verified: existingChecklist.skills_verified ?? (candidate.review_status === 'reviewed' || candidate.review_status === 'shortlisted'),
    code_quality_checked: existingChecklist.code_quality_checked ?? false,
    consistency_verified: existingChecklist.consistency_verified ?? false,
    interview_questions_prepped: existingChecklist.interview_questions_prepped ?? false,
  })

  const [reviewStatus, setReviewStatus] = useState<'pending' | 'reviewed' | 'shortlisted' | 'rejected'>(
    candidate.review_status || 'reviewed'
  )
  const [reviewerNotes, setReviewerNotes] = useState(
    (existingChecklist.notes as unknown as string) || ''
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleItem = (id: string) => {
    setChecklist(prev => {
      const next = { ...prev, [id]: !prev[id] }
      // If at least 3 items checked, auto-suggest 'reviewed' if currently pending
      const checkedCount = Object.values(next).filter(Boolean).length
      if (checkedCount >= 2 && reviewStatus === 'pending') {
        setReviewStatus('reviewed')
      }
      return next
    })
  }

  const selectAll = () => {
    const allChecked: Record<string, boolean> = {}
    CHECKLIST_ITEMS.forEach(item => {
      allChecked[item.id] = true
    })
    setChecklist(allChecked)
    if (reviewStatus === 'pending') {
      setReviewStatus('reviewed')
    }
  }

  const handleSave = async (customStatus?: 'pending' | 'reviewed' | 'shortlisted' | 'rejected') => {
    const targetStatus = customStatus || reviewStatus
    setIsSaving(true)
    setError('')

    try {
      const payloadChecklist = {
        ...checklist,
        notes: reviewerNotes,
      }

      const updated = await submissionApi.updateReview(candidate.id, {
        review_status: targetStatus,
        review_checklist: payloadChecklist,
        reviewed_by: 'Hiring Team',
      })

      onSuccess(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review status.')
    } finally {
      setIsSaving(false)
    }
  }

  const checkedCount = Object.values(checklist).filter(Boolean).length
  const progressPct = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100)

  return (
    <div className="fixed inset-0 bg-pine-forest/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-pine-border overflow-hidden">
        
        {/* Header */}
        <div className="bg-pine-forest-deep text-white px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pine-lime text-pine-forest flex items-center justify-center font-bold flex-shrink-0">
              <CheckSquare size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-pine-lime">Evaluation Review</span>
                <span className="text-white/40">·</span>
                <span className="text-[11px] sm:text-xs text-white/70 font-mono">{candidate.reference_id}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">{candidate.full_name}</h2>
              <p className="text-[11px] sm:text-xs text-white/60">{candidate.job_role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-pine-cream border-b border-pine-border px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[11px] sm:text-xs font-semibold text-pine-forest">Progress:</span>
            <div className="w-20 sm:w-32 h-2 bg-pine-border rounded-full overflow-hidden">
              <div
                className="h-full bg-pine-forest rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-pine-forest">{checkedCount}/{CHECKLIST_ITEMS.length} ({progressPct}%)</span>
          </div>
          <button
            type="button"
            onClick={selectAll}
            className="text-[11px] sm:text-xs font-semibold text-pine-forest hover:text-pine-slate transition-colors"
          >
            Check All
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-status-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Checklist items */}
          <div className="space-y-2.5">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = Boolean(checklist[item.id])

              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-pine-lime/10 border-pine-lime/60 shadow-xs'
                      : 'bg-white border-pine-border hover:bg-pine-cream/50'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 flex-shrink-0 text-pine-forest focus:outline-hidden"
                  >
                    {isChecked ? (
                      <div className="w-5 h-5 rounded-md bg-pine-forest text-pine-lime flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                    ) : (
                      <Square size={20} className="text-pine-slate-light" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isChecked ? 'text-pine-forest' : 'text-pine-slate'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-pine-slate-light mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Status Selection */}
          <div className="pt-2">
            <label className="text-xs font-bold text-pine-slate-light uppercase tracking-wider block mb-2">
              Hiring Decision Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'reviewed', label: 'Reviewed', color: 'border-blue-400 bg-blue-50 text-blue-900' },
                { val: 'shortlisted', label: 'Shortlist', color: 'border-pine-forest bg-pine-lime/20 text-pine-forest font-bold' },
                { val: 'rejected', label: 'Reject', color: 'border-red-300 bg-red-50 text-red-700' },
              ].map(({ val, label, color }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setReviewStatus(val as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    reviewStatus === val
                      ? `${color} ring-2 ring-pine-forest shadow-xs`
                      : 'border-pine-border bg-white text-pine-slate-light hover:bg-pine-cream'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reviewer notes */}
          <div>
            <label className="label">Reviewer Notes (Internal)</label>
            <textarea
              rows={2}
              value={reviewerNotes}
              onChange={e => setReviewerNotes(e.target.value)}
              placeholder="e.g. Strong system design in Kafka project, recommended for senior backend round..."
              className="input-field text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-pine-cream border-t border-pine-border px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs justify-center"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row gap-2">
            {onOpenInvitation && (
              <button
                type="button"
                onClick={() => {
                  handleSave('shortlisted')
                  onOpenInvitation(candidate)
                }}
                className="btn-secondary text-xs border-pine-forest text-pine-forest hover:bg-pine-lime/20 flex items-center justify-center gap-1.5 py-2 px-3"
              >
                Shortlist & Send Mail <ArrowRight size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="btn-primary text-xs flex items-center justify-center gap-1.5 py-2 px-3"
            >
              {isSaving ? (
                <>
                  <div className="spinner w-3 h-3 border-pine-forest" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Checklist
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
