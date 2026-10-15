import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Download, AlertCircle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Star, AlertTriangle, HelpCircle,
  Code, Database, Globe, Cpu, Shield, TestTube, FileText,
  BarChart2, User, Briefcase, Loader, RefreshCw, ExternalLink,
  Info,
} from 'lucide-react'
import Header from '../components/Header'
import { submissionApi } from '../services/api'
import type { FullReportResponse, ProcessingStatus, EvaluationReport } from '../types'

const STATUS_LABELS: Record<ProcessingStatus, string> = {
  uploaded: 'Uploaded',
  validating: 'Validating',
  queued: 'Queued',
  analyzing_resume: 'Analyzing Resume',
  analyzing_project: 'Analyzing Project',
  synthesizing_report: 'Synthesizing Report',
  completed: 'Completed',
  partial: 'Partial',
  failed: 'Failed',
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-pine-cream transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pine-navy flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <h2 className="font-bold text-pine-navy">{title}</h2>
        </div>
        {open ? <ChevronUp size={16} className="text-pine-slate-light" /> : <ChevronDown size={16} className="text-pine-slate-light" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-pine-border animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

function SkillBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pine-cream border border-pine-border text-pine-navy">
      {label}
    </span>
  )
}

function EvidencePill({ confidence }: { confidence: string }) {
  const colors: Record<string, string> = {
    high: 'bg-green-50 text-green-700 border border-green-200',
    medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low: 'bg-gray-50 text-gray-600 border border-gray-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${colors[confidence] || colors.low}`}>
      {confidence} confidence
    </span>
  )
}

function ScoreBar({ score, max = 10 }: { score: number | null; max?: number }) {
  if (score === null) {
    return <span className="text-xs text-pine-slate-light italic">Not assessable</span>
  }
  const pct = (score / max) * 100
  const color = pct >= 70 ? 'bg-pine-green' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-pine-cream rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-pine-navy w-10 text-right">
        {score.toFixed(1)}/{max}
      </span>
    </div>
  )
}

export default function ReportPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const [reportData, setReportData] = useState<FullReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<ProcessingStatus | null>(null)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (!submissionId) return
    let interval: number

    const fetchStatus = async () => {
      try {
        const s = await submissionApi.getStatus(submissionId)
        setStatus(s.status)

        if (s.status === 'completed' || s.status === 'partial') {
          clearInterval(interval)
          const report = await submissionApi.getReport(submissionId)
          setReportData(report)
        } else if (s.status === 'failed') {
          clearInterval(interval)
          setError(s.error_message || 'Evaluation failed.')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report')
        clearInterval(interval)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    interval = window.setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [submissionId])

  const handleRetry = async () => {
    if (!submissionId) return
    setRetrying(true)
    try {
      await submissionApi.retryEvaluation(submissionId)
      setError('')
      setLoading(true)
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      alert('Failed to retry')
    } finally {
      setRetrying(false)
    }
  }

  const exportMarkdown = () => {
    if (!reportData?.report) return
    const r = reportData.report
    const md = [
      `# Pine Labs Evaluation Report`,
      `**Candidate:** ${r.candidate_name}`,
      `**Role:** ${r.job_role}`,
      `**Reference:** ${reportData.reference_id}`,
      ``,
      `## Executive Summary`,
      r.executive_summary,
      ``,
      `## Hiring Team Takeaway`,
      r.hiring_team_takeaway,
      ``,
      `## Strengths`,
      ...r.strengths.map(s => `- **${s.claim}** (${s.confidence} confidence)\n  ${s.excerpt || ''}`),
      ``,
      `## Interview Questions`,
      ...r.interview_questions.map((q, i) =>
        `### ${i + 1}. ${q.question}\n**Why relevant:** ${q.relevance}\n**Strong answer demonstrates:** ${q.strong_answer_demonstrates}`
      ),
      ``,
      `## Limitations`,
      ...r.limitations.map(l => `- ${l}`),
    ].join('\n')

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${r.candidate_name.replace(/\s+/g, '-')}-evaluation.md`
    a.click()
  }

  const exportJSON = () => {
    if (!reportData) return
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportData.candidate.name.replace(/\s+/g, '-')}-evaluation.json`
    a.click()
  }

  // Loading state while evaluation in progress
  if (loading || (status && !['completed', 'partial', 'failed'].includes(status))) {
    return (
      <div className="min-h-screen bg-pine-cream">
        <Header showDashboardLink />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="spinner w-12 h-12 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-pine-navy">
            {status ? STATUS_LABELS[status] : 'Loading...'}
          </h2>
          <p className="text-pine-slate-light mt-2">
            The AI evaluation is in progress. This page will update automatically.
          </p>
          {status && (
            <div className="mt-4">
              <span className={`badge ${
                status === 'completed' ? 'badge-green' :
                status === 'failed' ? 'badge-error' :
                'badge-info'
              }`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Error state
  if (error && !reportData) {
    return (
      <div className="min-h-screen bg-pine-cream">
        <Header showDashboardLink />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <XCircle size={48} className="text-status-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-pine-navy">Evaluation Failed</h2>
          <p className="text-pine-slate-light mt-2">{error}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={handleRetry} className="btn-primary" disabled={retrying}>
              {retrying ? <><div className="spinner w-4 h-4" />Retrying...</> : <><RefreshCw size={16} />Retry</>}
            </button>
            <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData?.report) return null
  const { report, candidate, reference_id, warnings = [] } = reportData
  const ra = reportData.resume_analysis || report.resume_analysis
  const pa = reportData.project_analysis || report.project_analysis

  return (
    <div className="min-h-screen bg-pine-cream">
      <Header showDashboardLink />

      {/* Report header */}
      <div className="bg-pine-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link to="/dashboard" className="text-pine-slate-light hover:text-white text-sm flex items-center gap-1 mb-4">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{candidate.name}</h1>
              <p className="text-pine-slate-light mt-1">{candidate.role} · {reference_id}</p>
              <div className="flex items-center gap-2 mt-3">
                {candidate.github_url && (
                  <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-pine-slate-light hover:text-white flex items-center gap-1">
                    GitHub <ExternalLink size={10} />
                  </a>
                )}
                {candidate.linkedin_url && (
                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-pine-slate-light hover:text-white flex items-center gap-1">
                    LinkedIn <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={exportMarkdown} className="btn-secondary text-xs bg-transparent border-pine-navy-light text-white hover:bg-pine-navy-light">
                <Download size={14} /> Markdown
              </button>
              <button onClick={exportJSON} className="btn-secondary text-xs bg-transparent border-pine-navy-light text-white hover:bg-pine-navy-light">
                <Download size={14} /> JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Warnings */}
        {(warnings.length > 0 || reportData.status === 'partial') && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Partial Evaluation</p>
              <p className="text-xs text-amber-700 mt-1">
                Some stages of the evaluation encountered issues. Review the available data below.
              </p>
            </div>
          </div>
        )}

        {/* Executive Summary */}
        <div className="card p-6 mb-4 border-l-4 border-pine-green">
          <div className="flex items-center gap-2 text-xs font-semibold text-pine-green uppercase tracking-wider mb-3">
            <div className="w-3 h-0.5 bg-pine-green" />
            Executive Summary
          </div>
          <p className="text-pine-navy leading-relaxed">{report.executive_summary}</p>
          {report.hiring_team_takeaway && (
            <div className="mt-4 pt-4 border-t border-pine-border">
              <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-1">Hiring Team Takeaway</p>
              <p className="text-sm text-pine-slate font-medium">{report.hiring_team_takeaway}</p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
          <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            This is a preliminary AI-assisted technical review. It does not constitute a hiring decision.
            All evidence is based on static file analysis — runtime behavior, performance, and ownership
            cannot be verified without the interview.
          </p>
        </div>

        {/* Resume Overview */}
        <Section title="Resume Overview" icon={<User size={15} className="text-white" />}>
          <div className="pt-4">
            <p className="text-sm text-pine-slate leading-relaxed mb-4">{report.resume_overview}</p>

            {ra && (
              <div className="space-y-4">
                {/* Skills grid */}
                {ra.programming_languages?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Programming Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {ra.programming_languages.map(s => <SkillBadge key={s} label={s} />)}
                    </div>
                  </div>
                )}
                {ra.frameworks_and_libraries?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Frameworks & Libraries</p>
                    <div className="flex flex-wrap gap-2">
                      {ra.frameworks_and_libraries.map(s => <SkillBadge key={s} label={s} />)}
                    </div>
                  </div>
                )}
                {ra.tools_and_platforms?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Tools & Platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {ra.tools_and_platforms.map(s => <SkillBadge key={s} label={s} />)}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {ra.work_experience?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-3">Work Experience</p>
                    <div className="space-y-3">
                      {ra.work_experience.map((exp, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-pine-cream rounded-xl">
                          <div className="w-1 bg-pine-green rounded-full flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-sm font-semibold text-pine-navy">{exp.title}</p>
                            {exp.organization && <p className="text-xs text-pine-slate-light">{exp.organization}</p>}
                            {(exp.start_date || exp.end_date) && (
                              <p className="text-xs text-pine-slate-light">
                                {exp.start_date} {exp.end_date ? `— ${exp.end_date}` : ''}
                              </p>
                            )}
                            {exp.description && <p className="text-xs text-pine-slate mt-1">{exp.description}</p>}
                            {exp.technologies?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {exp.technologies.map(t => (
                                  <span key={t} className="text-[10px] font-medium bg-white border border-pine-border text-pine-slate px-1.5 py-0.5 rounded">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {ra.education?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Education</p>
                    {ra.education.map((edu, i) => (
                      <div key={i} className="p-3 bg-pine-cream rounded-xl">
                        <p className="text-sm font-semibold text-pine-navy">{edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}</p>
                        {edu.institution && <p className="text-xs text-pine-slate-light">{edu.institution}</p>}
                        {edu.graduation_year && <p className="text-xs text-pine-slate-light">{edu.graduation_year}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {ra.extraction_warnings?.length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Extraction Notes</p>
                    {ra.extraction_warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-600">{w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Project Overview */}
        <Section title="Project Overview" icon={<Code size={15} className="text-white" />}>
          <div className="pt-4 space-y-4">
            <p className="text-sm text-pine-slate leading-relaxed">{report.project_overview}</p>

            {pa && (
              <>
                {pa.project_title && (
                  <p className="text-lg font-bold text-pine-navy">
                    {pa.project_title}
                    {pa.problem_addressed && (
                      <span className="text-sm font-normal text-pine-slate ml-2">— {pa.problem_addressed}</span>
                    )}
                  </p>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {pa.frontend_technologies?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Frontend</p>
                      <div className="flex flex-wrap gap-1">
                        {pa.frontend_technologies.map(t => <SkillBadge key={t} label={t} />)}
                      </div>
                    </div>
                  )}
                  {pa.backend_technologies?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Backend</p>
                      <div className="flex flex-wrap gap-1">
                        {pa.backend_technologies.map(t => <SkillBadge key={t} label={t} />)}
                      </div>
                    </div>
                  )}
                  {pa.databases_and_services?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Databases & Services</p>
                      <div className="flex flex-wrap gap-1">
                        {pa.databases_and_services.map(t => <SkillBadge key={t} label={t} />)}
                      </div>
                    </div>
                  )}
                  {pa.ai_ml_components?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">AI/ML</p>
                      <div className="flex flex-wrap gap-1">
                        {pa.ai_ml_components.map(t => <SkillBadge key={t} label={t} />)}
                      </div>
                    </div>
                  )}
                </div>

                {pa.architecture_overview && (
                  <div>
                    <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Architecture</p>
                    <p className="text-sm text-pine-slate leading-relaxed">{pa.architecture_overview}</p>
                  </div>
                )}

                {pa.main_functionality?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Main Functionality</p>
                    <ul className="space-y-1">
                      {pa.main_functionality.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-pine-slate">
                          <CheckCircle size={13} className="text-pine-green flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </Section>

        {/* Technical Observations */}
        {report.technical_observations?.length > 0 && (
          <Section title="Technical Observations" icon={<BarChart2 size={15} className="text-white" />}>
            <div className="pt-4 space-y-3">
              {report.technical_observations.map((obs, i) => (
                <div key={i} className={`p-4 rounded-xl border ${
                  obs.is_positive
                    ? 'bg-green-50 border-green-100'
                    : obs.severity === 'issue' ? 'bg-red-50 border-red-100'
                    : 'bg-amber-50 border-amber-100'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {obs.is_positive
                        ? <CheckCircle size={15} className="text-pine-green" />
                        : obs.severity === 'issue'
                        ? <XCircle size={15} className="text-status-error" />
                        : <AlertTriangle size={15} className="text-amber-500" />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-bold text-pine-navy uppercase tracking-wider mb-1">{obs.category}</p>
                      <p className="text-sm text-pine-slate">{obs.observation}</p>
                      {obs.evidence?.map((ev, j) => ev.excerpt && (
                        <div key={j} className="mt-2 flex items-start gap-2">
                          <EvidencePill confidence={ev.confidence} />
                          <code className="text-xs text-pine-slate bg-white rounded px-2 py-1 flex-1">
                            {ev.excerpt.slice(0, 150)}{ev.excerpt.length > 150 ? '...' : ''}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Strengths */}
        {report.strengths?.length > 0 && (
          <Section title="Strengths" icon={<Star size={15} className="text-white" />}>
            <div className="pt-4 space-y-3">
              {report.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-pine-green-light rounded-xl">
                  <Star size={14} className="text-pine-green flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-pine-navy">{s.claim}</p>
                    {s.excerpt && (
                      <p className="text-xs text-pine-slate mt-1">{s.excerpt.slice(0, 200)}</p>
                    )}
                    <div className="mt-1.5">
                      <EvidencePill confidence={s.confidence} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Potential Concerns */}
        {report.potential_concerns?.length > 0 && (
          <Section title="Potential Concerns" icon={<AlertTriangle size={15} className="text-white" />} defaultOpen={false}>
            <div className="pt-4 space-y-3">
              {report.potential_concerns.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-0.5">{c.category}</p>
                    <p className="text-sm text-amber-700">{c.observation}</p>
                    {c.evidence?.map((ev, j) => ev.excerpt && (
                      <div key={j} className="mt-1.5 flex items-start gap-2">
                        <EvidencePill confidence={ev.confidence} />
                        <p className="text-xs text-amber-600">Source: {ev.source}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Resume/Project Consistency */}
        {report.consistency_checks?.length > 0 && (
          <Section title="Resume ↔ Project Consistency" icon={<CheckCircle size={15} className="text-white" />} defaultOpen={false}>
            <div className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-pine-border">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-pine-slate-light uppercase">Claim / Technology</th>
                      <th className="text-center py-2 px-2 text-xs font-semibold text-pine-slate-light uppercase">In Resume</th>
                      <th className="text-center py-2 px-2 text-xs font-semibold text-pine-slate-light uppercase">In Project</th>
                      <th className="text-left py-2 pl-4 text-xs font-semibold text-pine-slate-light uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.consistency_checks.map((c, i) => (
                      <tr key={i} className="border-b border-pine-border last:border-0">
                        <td className="py-2 pr-4 font-medium text-pine-navy">{c.item}</td>
                        <td className="py-2 px-2 text-center">
                          {c.in_resume
                            ? <CheckCircle size={14} className="text-pine-green mx-auto" />
                            : <XCircle size={14} className="text-pine-border mx-auto" />}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {c.in_project
                            ? <CheckCircle size={14} className="text-pine-green mx-auto" />
                            : <XCircle size={14} className="text-pine-border mx-auto" />}
                        </td>
                        <td className="py-2 pl-4 text-xs text-pine-slate-light">{c.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        )}

        {/* Interview Questions */}
        {report.interview_questions?.length > 0 && (
          <Section title="Suggested Interview Questions" icon={<HelpCircle size={15} className="text-white" />}>
            <div className="pt-4 space-y-4">
              {report.interview_questions.map((q, i) => (
                <div key={i} className="border border-pine-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-pine-cream flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-pine-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold text-pine-navy">{q.question}</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light">Why ask this</p>
                      <p className="text-xs text-pine-slate">{q.relevance}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light">Prompted by</p>
                      <p className="text-xs text-pine-slate">{q.evidence_or_uncertainty}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-pine-green">Strong answer demonstrates</p>
                      <p className="text-xs text-pine-slate">{q.strong_answer_demonstrates}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Rubric */}
        {report.rubric_assessments?.length > 0 && (
          <Section title="Technical Review Rubric" icon={<BarChart2 size={15} className="text-white" />} defaultOpen={false}>
            <div className="pt-4 space-y-4">
              {report.rubric_assessments.map((r, i) => (
                <div key={i} className="p-4 bg-pine-cream rounded-xl">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-sm font-bold text-pine-navy">{r.dimension}</p>
                      <p className="text-xs text-pine-slate-light">{r.description}</p>
                    </div>
                    <span className={`badge flex-shrink-0 ${
                      r.confidence === 'high' ? 'badge-green' :
                      r.confidence === 'medium' ? 'badge-warning' :
                      'badge-pending'
                    }`}>
                      {r.confidence}
                    </span>
                  </div>
                  <ScoreBar score={r.score} max={r.max_score} />
                  {r.notes && <p className="text-xs text-pine-slate mt-2">{r.notes}</p>}
                  {r.evidence?.length > 0 && (
                    <div className="mt-2">
                      {r.evidence.map((e, j) => (
                        <p key={j} className="text-xs text-pine-slate flex items-center gap-1">
                          <CheckCircle size={10} className="text-pine-green flex-shrink-0" />
                          {e}
                        </p>
                      ))}
                    </div>
                  )}
                  {r.missing_evidence?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-amber-600 uppercase">Missing evidence</p>
                      {r.missing_evidence.map((e, j) => (
                        <p key={j} className="text-xs text-amber-600">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Limitations */}
        {report.limitations?.length > 0 && (
          <Section title="Analysis Limitations" icon={<AlertCircle size={15} className="text-white" />} defaultOpen={false}>
            <div className="pt-4">
              <p className="text-xs text-pine-slate-light mb-3">
                The following aspects could not be determined from static file analysis:
              </p>
              <ul className="space-y-2">
                {report.limitations.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-pine-slate">
                    <div className="w-1.5 h-1.5 rounded-full bg-pine-slate-light flex-shrink-0 mt-1.5" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        {/* Processing metadata */}
        <div className="mt-6 p-4 bg-white border border-pine-border rounded-xl">
          <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Processing Metadata</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-pine-slate-light">Model Used</p>
              <p className="font-mono font-medium text-pine-navy">
                {String(report.processing_metadata?.model_used || 'N/A')}
              </p>
            </div>
            <div>
              <p className="text-pine-slate-light">Submitted</p>
              <p className="font-medium text-pine-navy">
                {reportData.submitted_at ? new Date(reportData.submitted_at).toLocaleDateString('en-IN') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-pine-slate-light">Completed</p>
              <p className="font-medium text-pine-navy">
                {reportData.completed_at ? new Date(reportData.completed_at).toLocaleDateString('en-IN') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
