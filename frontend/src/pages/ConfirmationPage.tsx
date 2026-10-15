import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { CheckCircle, Clock, AlertCircle, Loader, ArrowRight, Copy, Check } from 'lucide-react'
import Header from '../components/Header'
import { submissionApi } from '../services/api'
import type { EvaluationStatus, ProcessingStatus } from '../types'

const STAGE_MESSAGES: Record<ProcessingStatus, string> = {
  uploaded: 'Application received',
  validating: 'Validating your files...',
  queued: 'Queued for AI analysis',
  analyzing_resume: 'Analyzing your resume with AI...',
  analyzing_project: 'Inspecting your project files...',
  synthesizing_report: 'Preparing your evaluation report...',
  completed: 'Evaluation complete!',
  partial: 'Evaluation partially complete',
  failed: 'Evaluation encountered an issue',
}

const STAGE_ORDER: ProcessingStatus[] = [
  'uploaded', 'queued', 'analyzing_resume', 'analyzing_project', 'synthesizing_report', 'completed'
]

function getStageProgress(status: ProcessingStatus): number {
  const idx = STAGE_ORDER.indexOf(status)
  if (idx === -1) return status === 'completed' || status === 'partial' ? 100 : 0
  return Math.round(((idx + 1) / STAGE_ORDER.length) * 100)
}

export default function ConfirmationPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const location = useLocation()
  const [status, setStatus] = useState<EvaluationStatus | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const referenceId = (location.state as { reference_id?: string })?.reference_id || '—'
  const fullName = (location.state as { full_name?: string })?.full_name || 'Candidate'

  useEffect(() => {
    if (!submissionId) return

    let interval: number

    const poll = async () => {
      try {
        const s = await submissionApi.getStatus(submissionId)
        setStatus(s)
        if (s.status === 'completed' || s.status === 'partial' || s.status === 'failed') {
          clearInterval(interval)
        }
      } catch (err) {
        setError('Could not check evaluation status.')
        clearInterval(interval)
      }
    }

    poll()
    interval = window.setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [submissionId])

  const copyRefId = () => {
    navigator.clipboard.writeText(referenceId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const currentStatus = status?.status || 'queued'
  const isComplete = currentStatus === 'completed' || currentStatus === 'partial'
  const isFailed = currentStatus === 'failed'
  const progress = getStageProgress(currentStatus)

  return (
    <div className="min-h-screen bg-pine-cream">
      <Header showDashboardLink />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Success header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-pine-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-green">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-pine-navy">
            Application Submitted!
          </h1>
          <p className="text-pine-slate-light mt-2">
            Thank you, {fullName}. We've received your application and started the AI analysis.
          </p>
        </div>

        {/* Reference ID card */}
        <div className="card p-6 mb-6 animate-slide-up">
          <div className="text-center">
            <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">
              Your Reference ID
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-pine-navy tracking-widest font-mono">
                {referenceId}
              </span>
              <button
                onClick={copyRefId}
                className="p-2 rounded-lg hover:bg-pine-cream transition-colors"
                title="Copy reference ID"
              >
                {copied ? <Check size={16} className="text-pine-green" /> : <Copy size={16} className="text-pine-slate-light" />}
              </button>
            </div>
            <p className="text-xs text-pine-slate-light mt-2">
              Save this ID to track your evaluation status
            </p>
          </div>
        </div>

        {/* Evaluation status */}
        <div className="card p-6 mb-6 animate-slide-up animation-delay-100">
          <h2 className="text-sm font-bold text-pine-navy mb-4">Evaluation Progress</h2>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-pine-slate-light mb-2">
              <span>{STAGE_MESSAGES[currentStatus]}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-pine-cream rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isFailed ? 'bg-status-error' : 'bg-pine-green'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stage pills */}
          <div className="flex flex-wrap gap-2">
            {STAGE_ORDER.map((stage) => {
              const stageIdx = STAGE_ORDER.indexOf(stage)
              const currentIdx = STAGE_ORDER.indexOf(currentStatus)
              const done = stageIdx < currentIdx || isComplete
              const active = stageIdx === currentIdx && !isComplete && !isFailed

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    done
                      ? 'bg-pine-green-light border-pine-green text-pine-green-dark'
                      : active
                      ? 'bg-pine-navy text-white border-pine-navy'
                      : 'bg-white border-pine-border text-pine-slate-light'
                  }`}
                >
                  {done ? (
                    <Check size={10} strokeWidth={3} />
                  ) : active ? (
                    <div className="w-2.5 h-2.5 spinner" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-pine-border" />
                  )}
                  {STAGE_MESSAGES[stage].replace('...', '')}
                </div>
              )
            })}
          </div>

          {/* Error */}
          {isFailed && status?.error_message && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle size={14} className="text-status-error flex-shrink-0 mt-0.5" />
              <p className="text-xs text-status-error">{status.error_message}</p>
            </div>
          )}

          {/* Waiting message */}
          {!isComplete && !isFailed && (
            <p className="text-xs text-pine-slate-light mt-4 flex items-center gap-2">
              <Loader size={12} className="animate-spin" />
              Evaluation typically takes 1–3 minutes. You can close this page and return later.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up animation-delay-200">
          {isComplete && submissionId && (
            <Link
              to={`/report/${submissionId}`}
              className="btn-primary flex-1 justify-center"
            >
              View Evaluation Report <ArrowRight size={16} />
            </Link>
          )}
          <Link to="/" className="btn-secondary flex-1 justify-center">
            Submit Another Application
          </Link>
        </div>

        {/* Info about report access */}
        <div className="mt-6 p-4 bg-white border border-pine-border rounded-xl text-center">
          <p className="text-xs text-pine-slate-light">
            The evaluation report is shared with the Pine Labs hiring team. 
            As a candidate, you can view your reference ID and submission status on this page.
          </p>
        </div>
      </div>
    </div>
  )
}
