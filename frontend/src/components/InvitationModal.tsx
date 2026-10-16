import { useState } from 'react'
import {
  Mail, Calendar, Clock, Sparkles, CheckCircle2,
  X, AlertCircle, Send, Eye, Edit3, UserCheck, ShieldCheck
} from 'lucide-react'
import { submissionApi } from '../services/api'
import type { SubmissionListItem } from '../types'

interface InvitationModalProps {
  candidates: SubmissionListItem[]
  onClose: () => void
  onSuccess: () => void
}

export default function InvitationModal({ candidates, onClose, onSuccess }: InvitationModalProps) {
  // Default dates: Assessment 3 days later, Tech 6 days later, HR 9 days later
  const now = new Date()
  const d1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const d2 = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
  const d3 = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000)

  const formatDateDefault = (d: Date, timeStr: string) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${timeStr}`
  }

  const [assessmentDate, setAssessmentDate] = useState(formatDateDefault(d1, '10:00 AM IST'))
  const [technicalDate, setTechnicalDate] = useState(formatDateDefault(d2, '02:00 PM IST'))
  const [hrDate, setHrDate] = useState(formatDateDefault(d3, '11:30 AM IST'))
  const [customMessage, setCustomMessage] = useState(
    'Congratulations on advancing! We were impressed by your project submission and look forward to the next rounds.'
  )
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose')
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!assessmentDate || !technicalDate || !hrDate) {
      setError('Please provide dates for all 3 rounds.')
      return
    }

    setIsSending(true)
    setError('')

    try {
      const response = await submissionApi.sendInterviewInvitation({
        submission_ids: candidates.map(c => c.id),
        assessment_date: assessmentDate,
        technical_date: technicalDate,
        hr_date: hrDate,
        custom_message: customMessage || undefined,
      })

      setResult(response)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations.')
    } finally {
      setIsSending(false)
    }
  }

  const primaryCandidate = candidates[0]

  return (
    <div className="fixed inset-0 bg-pine-forest/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-pine-border overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-pine-forest-deep text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pine-lime text-pine-forest flex items-center justify-center font-bold">
              <Mail size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pine-lime">Hiring Action</span>
                <span className="text-white/40">·</span>
                <span className="text-xs text-white/70">{candidates.length} Candidate{candidates.length > 1 ? 's' : ''} Selected</span>
              </div>
              <h2 className="text-lg font-bold text-white">Shortlist & Send Interview Invitation</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success View */}
        {result ? (
          <div className="p-8 text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-pine-lime/20 text-pine-forest mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 size={36} className="text-pine-forest" />
            </div>
            <h3 className="text-xl font-bold text-pine-forest">Shortlist Invitations Dispatched!</h3>
            <p className="text-sm text-pine-slate-light mt-2 max-w-md mx-auto">
              Shortlist invitations and interview schedules have been sent to the selected candidates.
            </p>

            <div className="mt-6 p-4 bg-pine-cream rounded-xl text-left border border-pine-border max-w-lg mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold text-pine-slate-light mb-2">
                <span>RECIPIENTS</span>
                <span className="text-pine-forest font-bold">{result.successful_count} DELIVERED</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {result.results.map((r: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-pine-border/50 last:border-0">
                    <span className="font-medium text-pine-forest">{r.candidate_name} ({r.role})</span>
                    <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                      <CheckCircle2 size={12} /> Delivered
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-pine-border px-6 pt-3 bg-pine-cream/50">
              <button
                onClick={() => setActiveTab('compose')}
                className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'compose'
                    ? 'border-pine-forest text-pine-forest'
                    : 'border-transparent text-pine-slate-light hover:text-pine-forest'
                }`}
              >
                <Edit3 size={15} />
                Configure Schedule & Message
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'preview'
                    ? 'border-pine-forest text-pine-forest'
                    : 'border-transparent text-pine-slate-light hover:text-pine-forest'
                }`}
              >
                <Eye size={15} />
                Email Preview
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-status-error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Recipients Pills */}
              <div>
                <label className="text-xs font-bold text-pine-slate-light uppercase tracking-wider block mb-2">
                  Shortlisted Candidates ({candidates.length})
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-pine-cream/60 rounded-xl border border-pine-border">
                  {candidates.map(c => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-pine-border text-pine-forest shadow-xs"
                    >
                      <UserCheck size={12} className="text-pine-forest" />
                      {c.full_name}
                      <span className="text-[10px] text-pine-slate-light font-normal">({c.email})</span>
                    </span>
                  ))}
                </div>
              </div>

              {activeTab === 'compose' ? (
                <>
                  {/* Schedule Inputs */}
                  <div className="space-y-4 bg-pine-cream/40 p-4 rounded-xl border border-pine-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pine-forest uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={14} className="text-pine-mint" />
                        Next Round Schedule Dates
                      </span>
                      <span className="text-[11px] text-pine-slate-light">Candidates will receive these exact dates</span>
                    </div>

                    {/* Round 1 */}
                    <div>
                      <label className="text-xs font-semibold text-pine-forest flex items-center gap-1.5 mb-1">
                        <span className="w-5 h-5 rounded-full bg-pine-forest text-pine-lime text-[11px] font-bold flex items-center justify-center">1</span>
                        Online Assessment Date & Time
                      </label>
                      <input
                        type="text"
                        value={assessmentDate}
                        onChange={e => setAssessmentDate(e.target.value)}
                        placeholder="e.g. October 22, 2026 at 10:00 AM IST"
                        className="input-field text-sm"
                      />
                      <p className="text-[11px] text-pine-slate-light mt-0.5">Coding test & system architecture challenges (90 mins)</p>
                    </div>

                    {/* Round 2 */}
                    <div>
                      <label className="text-xs font-semibold text-pine-forest flex items-center gap-1.5 mb-1">
                        <span className="w-5 h-5 rounded-full bg-pine-forest text-pine-lime text-[11px] font-bold flex items-center justify-center">2</span>
                        Round 1 — Technical Architecture Interview Date & Time
                      </label>
                      <input
                        type="text"
                        value={technicalDate}
                        onChange={e => setTechnicalDate(e.target.value)}
                        placeholder="e.g. October 25, 2026 at 02:00 PM IST"
                        className="input-field text-sm"
                      />
                      <p className="text-[11px] text-pine-slate-light mt-0.5">Code walk-through & system design with Senior Architect (60 mins)</p>
                    </div>

                    {/* Round 3 */}
                    <div>
                      <label className="text-xs font-semibold text-pine-forest flex items-center gap-1.5 mb-1">
                        <span className="w-5 h-5 rounded-full bg-pine-forest text-pine-lime text-[11px] font-bold flex items-center justify-center">3</span>
                        Round 2 — HR & Leadership Interview Date & Time
                      </label>
                      <input
                        type="text"
                        value={hrDate}
                        onChange={e => setHrDate(e.target.value)}
                        placeholder="e.g. October 28, 2026 at 11:30 AM IST"
                        className="input-field text-sm"
                      />
                      <p className="text-[11px] text-pine-slate-light mt-0.5">Cultural fit, team alignment, and growth discussion (45 mins)</p>
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div>
                    <label className="label flex items-center justify-between">
                      <span>Personalized Note from Hiring Team (Optional)</span>
                      <span className="text-[11px] text-pine-slate-light font-normal">Appears in highlighted box in email</span>
                    </label>
                    <textarea
                      rows={3}
                      value={customMessage}
                      onChange={e => setCustomMessage(e.target.value)}
                      placeholder="Add an encouraging note or specific guidance regarding their project submission..."
                      className="input-field text-sm leading-relaxed"
                    />
                  </div>
                </>
              ) : (
                /* Email Preview Tab */
                <div className="border border-pine-border rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="bg-pine-forest-deep p-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pine-lime">Pine Labs Talent Intelligence</span>
                    <h4 className="text-base font-bold mt-1">Congratulations, {primaryCandidate?.full_name || 'Candidate'}!</h4>
                    <p className="text-xs text-white/70">You have been shortlisted for {primaryCandidate?.job_role || 'Engineering Role'}</p>
                  </div>
                  <div className="p-4 space-y-3 text-xs text-pine-forest leading-relaxed">
                    <p>Dear <strong>{primaryCandidate?.full_name || 'Candidate'}</strong>,</p>
                    <p className="text-pine-slate-light">
                      Thank you for applying to Pine Labs and submitting your technical project for evaluation. Our engineering and talent evaluation team has thoroughly reviewed your resume, static project architecture, and code evaluation.
                    </p>
                    {customMessage && (
                      <div className="p-3 bg-pine-cream border-l-4 border-pine-lime rounded text-xs italic">
                        "{customMessage}"
                      </div>
                    )}
                    <div className="p-3 bg-pine-cream/70 rounded-lg border border-pine-border space-y-2">
                      <p className="font-bold text-[11px] uppercase tracking-wider text-pine-forest">Upcoming Evaluation Schedule:</p>
                      <div className="border-b border-pine-border pb-1.5">
                        <span className="font-semibold">1. Online Assessment:</span> <span className="text-pine-mint font-bold">{assessmentDate}</span> (90 Mins)
                      </div>
                      <div className="border-b border-pine-border pb-1.5">
                        <span className="font-semibold">2. Round 1 (Technical Interview):</span> <span className="text-pine-mint font-bold">{technicalDate}</span> (60 Mins)
                      </div>
                      <div>
                        <span className="font-semibold">3. Round 2 (HR & Leadership):</span> <span className="text-pine-mint font-bold">{hrDate}</span> (45 Mins)
                      </div>
                    </div>
                    <p className="text-pine-slate-light text-[11px]">
                      Meeting links and assessment credentials will be shared prior to each round.
                    </p>
                    <p className="pt-2 text-pine-forest font-semibold">
                      Warm regards,<br />
                      Pine Labs Talent Acquisition Team
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-pine-cream border-t border-pine-border px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-pine-slate-light flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-pine-forest" />
                Updates candidate status to <strong>Shortlisted</strong>
              </span>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="spinner w-3.5 h-3.5 border-pine-forest" />
                      Sending Invitations...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Shortlist Invitations ({candidates.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
