import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Download, AlertCircle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Star, AlertTriangle, HelpCircle,
  Code, Database, Globe, Cpu, Shield, TestTube, FileText,
  BarChart2, User, Briefcase, Loader, RefreshCw, ExternalLink,
  Info, CheckSquare, Mail, Sparkles, Printer, FileDown, CheckCircle2
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Navbar from '../components/Navbar'
import ReviewChecklistModal from '../components/ReviewChecklistModal'
import InvitationModal from '../components/InvitationModal'
import { submissionApi } from '../services/api'
import type { FullReportResponse, ProcessingStatus, SubmissionListItem } from '../types'

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
    <div className="card overflow-hidden mb-4 print:border-none print:shadow-none print:mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-pine-cream transition-colors print:p-0 print:mb-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pine-forest text-pine-lime flex items-center justify-center flex-shrink-0 print:hidden">
            {icon}
          </div>
          <h2 className="font-bold text-pine-forest text-base">{title}</h2>
        </div>
        <div className="print:hidden">
          {open ? <ChevronUp size={16} className="text-pine-slate-light" /> : <ChevronDown size={16} className="text-pine-slate-light" />}
        </div>
      </button>
      {(open || true) && (
        <div className={`px-5 pb-5 border-t border-pine-border animate-fade-in print:border-none print:p-0 ${open ? 'block' : 'hidden print:block'}`}>
          {children}
        </div>
      )}
    </div>
  )
}

function SkillBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pine-cream border border-pine-border text-pine-forest">
      {label}
    </span>
  )
}

function EvidencePill({ confidence }: { confidence: string }) {
  const colors: Record<string, string> = {
    high: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    medium: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    low: 'bg-gray-50 text-gray-700 border border-gray-200',
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
  const color = pct >= 70 ? 'bg-pine-forest' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-pine-cream rounded-full overflow-hidden border border-pine-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-pine-forest w-10 text-right">
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
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  // Review & Shortlist state
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'reviewed' | 'shortlisted' | 'rejected'>('pending')
  const [emailSent, setEmailSent] = useState(false)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [showInvitationModal, setShowInvitationModal] = useState(false)
  const [successBanner, setSuccessBanner] = useState('')

  const fetchReport = async () => {
    if (!submissionId) return
    try {
      const s = await submissionApi.getStatus(submissionId)
      setStatus(s.status)

      if (s.status === 'completed' || s.status === 'partial') {
        const [report, subDetails] = await Promise.all([
          submissionApi.getReport(submissionId),
          submissionApi.getSubmission(submissionId).catch(() => null),
        ])
        setReportData(report)
        if (subDetails) {
          setReviewStatus(subDetails.review_status as any || 'pending')
          setEmailSent(Boolean(subDetails.email_sent))
        }
      } else if (s.status === 'failed') {
        setError(s.error_message || 'Evaluation failed.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!submissionId) return
    fetchReport()
    const interval = window.setInterval(fetchReport, 6000)
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

  const exportPDF = async () => {
    if (!reportData?.report) return
    setIsExportingPDF(true)
    try {
      const element = document.getElementById('report-document-body')
      if (!element) {
        window.print()
        return
      }

      // Generate canvas at high resolution
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      const safeName = (reportData.candidate.name || 'Candidate').replace(/\s+/g, '-')
      pdf.save(`${safeName}-PineLabs-Evaluation-Report.pdf`)
    } catch (err) {
      console.error('Error generating PDF with html2canvas, falling back to window.print():', err)
      window.print()
    } finally {
      setIsExportingPDF(false)
    }
  }

  const exportMarkdown = () => {
    if (!reportData?.report) return
    const r = reportData.report
    const md = [
      `# Pine Labs Talent Intelligence — Technical Evaluation Report`,
      `**Candidate:** ${r.candidate_name}`,
      `**Role:** ${r.job_role}`,
      `**Reference ID:** ${reportData.reference_id}`,
      `**Generated On:** ${new Date().toLocaleDateString('en-IN')}`,
      ``,
      `---`,
      `## Executive Summary`,
      r.executive_summary,
      ``,
      `## Hiring Team Takeaway`,
      r.hiring_team_takeaway,
      ``,
      `## Strengths Identified`,
      ...r.strengths.map(s => `- **${s.claim}** (${s.confidence} confidence)\n  ${s.excerpt || ''}`),
      ``,
      `## Technical Observations`,
      ...r.technical_observations.map(o => `- [${o.category.toUpperCase()}] ${o.observation}`),
      ``,
      `## Suggested Clarification Questions for Interview`,
      ...r.interview_questions.map((q, i) =>
        `### ${i + 1}. ${q.question}\n**Why relevant:** ${q.relevance}\n**Strong answer demonstrates:** ${q.strong_answer_demonstrates}`
      ),
      ``,
      `## Limitations`,
      ...r.limitations.map(l => `- ${l}`),
    ].join('\n\n')

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

  // Loading state
  if (loading || (status && !['completed', 'partial', 'failed'].includes(status))) {
    return (
      <div className="min-h-screen bg-pine-cream">
        <Navbar variant="dashboard" />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="spinner w-12 h-12 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-pine-forest">
            {status ? STATUS_LABELS[status] : 'Analyzing Candidate Submission...'}
          </h2>
          <p className="text-pine-slate-light mt-2 text-sm">
            AI evaluation pipeline is inspecting the resume and static project code. This page updates automatically.
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
        <Navbar variant="dashboard" />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <XCircle size={48} className="text-status-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-pine-forest">Evaluation Failed</h2>
          <p className="text-sm text-pine-slate-light mt-2 max-w-md mx-auto">{error}</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="btn-primary mt-6 inline-flex"
          >
            {retrying ? 'Retrying...' : 'Retry Evaluation'}
          </button>
        </div>
      </div>
    )
  }

  if (!reportData?.report) return null
  const { report, candidate, reference_id, warnings = [] } = reportData
  const ra = reportData.resume_analysis || report.resume_analysis
  const pa = reportData.project_analysis || report.project_analysis

  // Mock candidate for modal
  const candidateItem: SubmissionListItem = {
    id: submissionId || '',
    reference_id: reference_id,
    full_name: candidate.name,
    email: candidate.email,
    job_role: candidate.role,
    status: reportData.status,
    review_status: reviewStatus,
    email_sent: emailSent,
    submitted_at: reportData.submitted_at || new Date().toISOString(),
    resume_filename: 'resume.pdf',
    project_filename: 'project.zip',
  }

  return (
    <div className="min-h-screen bg-pine-cream pb-20">
      <Navbar variant="dashboard" />

      {/* Top Banner */}
      <div className="bg-pine-forest-deep text-white print:bg-white print:text-black">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link to="/dashboard" className="text-white/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 mb-4 print:hidden">
            <ArrowLeft size={14} /> Back to Hiring Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pine-lime bg-white/10 px-2 py-0.5 rounded">
                  CONFIDENTIAL TECHNICAL REPORT
                </span>
                <span className="text-white/40 font-mono text-xs">· {reference_id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white print:text-black">{candidate.name}</h1>
              <p className="text-white/70 text-sm mt-1">{candidate.role}</p>

              {/* Candidate social / links */}
              <div className="flex items-center gap-3 mt-3 print:hidden">
                {candidate.email && (
                  <span className="text-xs text-white/60 font-mono flex items-center gap-1">
                    <Mail size={12} /> {candidate.email}
                  </span>
                )}
                {candidate.github_url && (
                  <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-pine-lime hover:underline flex items-center gap-1">
                    GitHub <ExternalLink size={10} />
                  </a>
                )}
                {candidate.linkedin_url && (
                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-pine-lime hover:underline flex items-center gap-1">
                    LinkedIn <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            {/* Export buttons */}
            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                onClick={exportPDF}
                disabled={isExportingPDF}
                className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
                title="Download formatted PDF report"
              >
                {isExportingPDF ? (
                  <>
                    <div className="spinner w-3.5 h-3.5 border-pine-forest" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileDown size={14} />
                    Download PDF
                  </>
                )}
              </button>

              <button
                onClick={exportMarkdown}
                className="btn-secondary text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                title="Download markdown notes"
              >
                <Download size={13} /> Markdown
              </button>

              <button
                onClick={exportJSON}
                className="btn-secondary text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                title="Download raw evaluation JSON"
              >
                <Download size={13} /> JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Success notification */}
        {successBanner && (
          <div className="p-4 bg-pine-lime/20 border border-pine-lime text-pine-forest rounded-xl flex items-center gap-3 mb-6 animate-fade-in shadow-xs">
            <CheckCircle2 size={18} className="text-pine-forest flex-shrink-0" />
            <p className="text-sm font-semibold">{successBanner}</p>
          </div>
        )}

        {/* Hiring Action & Review Status Bar */}
        <div className="card p-5 mb-6 border-l-4 border-pine-forest flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pine-cream flex items-center justify-center flex-shrink-0">
              <CheckSquare size={20} className="text-pine-forest" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-pine-slate-light uppercase tracking-wider">Hiring Decision</span>
                {emailSent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Mail size={10} /> Shortlist Invitation Email Sent
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`badge font-semibold ${
                  reviewStatus === 'shortlisted' ? 'badge-green' :
                  reviewStatus === 'reviewed' ? 'badge-info' :
                  reviewStatus === 'rejected' ? 'badge-error' :
                  'badge-pending'
                }`}>
                  Status: {reviewStatus.toUpperCase()}
                </span>
                <span className="text-xs text-pine-slate-light">
                  {reviewStatus === 'shortlisted' ? 'Selected for online assessment & interview rounds' :
                   reviewStatus === 'reviewed' ? 'Summary & codebase checked by team' :
                   'Pending review by hiring team'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChecklistModal(true)}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <CheckSquare size={14} />
              Review Checklist
            </button>
            <button
              onClick={() => setShowInvitationModal(true)}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Mail size={14} />
              Shortlist & Send Email
            </button>
          </div>
        </div>

        {/* Printable/Capture Report Document Body */}
        <div id="report-document-body" className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-pine-border shadow-xs">
          
          {/* Print only header */}
          <div className="hidden print:block border-b border-black pb-4 mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">PINE LABS TALENT INTELLIGENCE</div>
            <h1 className="text-2xl font-bold text-black mt-1">{candidate.name}</h1>
            <p className="text-sm text-gray-600">{candidate.role} · Ref: {reference_id}</p>
          </div>

          {/* Warnings */}
          {(warnings.length > 0 || reportData.status === 'partial') && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Partial Evaluation</p>
                <p className="text-xs text-amber-700 mt-1">
                  Some stages of the evaluation encountered issues. Review available evidence below.
                </p>
              </div>
            </div>
          )}

          {/* Executive Summary */}
          <div className="card p-6 border-l-4 border-pine-forest print:border-l-2 print:p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-pine-forest uppercase tracking-wider mb-3">
              <div className="w-3 h-0.5 bg-pine-forest" />
              Executive Summary
            </div>
            <p className="text-pine-forest leading-relaxed text-sm sm:text-base">{report.executive_summary}</p>
            {report.hiring_team_takeaway && (
              <div className="mt-4 pt-4 border-t border-pine-border">
                <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-1">Hiring Team Takeaway</p>
                <p className="text-sm text-pine-forest font-medium">{report.hiring_team_takeaway}</p>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5 print:hidden">
            <Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              This report is generated by Pine Labs Talent Intelligence based on static code inspection and resume parsing.
              All strengths, red flags, and clarification questions are evidence-backed to guide your interview rounds.
            </p>
          </div>

          {/* Resume Overview */}
          <Section title="Resume Overview" icon={<User size={15} />}>
            <div className="pt-3">
              <p className="text-sm text-pine-forest leading-relaxed mb-4">{report.resume_overview}</p>

              {ra && (
                <div className="space-y-4">
                  {ra.programming_languages?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Programming Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ra.programming_languages.map(s => <SkillBadge key={s} label={s} />)}
                      </div>
                    </div>
                  )}

                  {ra.frameworks_and_libraries?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Frameworks & Libraries</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ra.frameworks_and_libraries.map(s => <SkillBadge key={s} label={s} />)}
                      </div>
                    </div>
                  )}

                  {ra.tools_and_platforms?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Tools & Platforms</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ra.tools_and_platforms.map(s => <SkillBadge key={s} label={s} />)}
                      </div>
                    </div>
                  )}

                  {ra.work_experience?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-3">Work Experience</p>
                      <div className="space-y-3">
                        {ra.work_experience.map((exp, i) => (
                          <div key={i} className="flex gap-3 p-3.5 bg-pine-cream/70 rounded-xl border border-pine-border">
                            <div className="w-1 bg-pine-forest rounded-full flex-shrink-0 mt-1" />
                            <div>
                              <p className="text-sm font-bold text-pine-forest">{exp.title}</p>
                              {exp.organization && <p className="text-xs text-pine-slate-light font-medium">{exp.organization}</p>}
                              {(exp.start_date || exp.end_date) && (
                                <p className="text-[11px] text-pine-slate-light mt-0.5">
                                  {exp.start_date} {exp.end_date ? `— ${exp.end_date}` : ''}
                                </p>
                              )}
                              {exp.description && <p className="text-xs text-pine-forest mt-1.5 leading-relaxed">{exp.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>

          {/* Project Overview */}
          <Section title="Project Architecture & Code Overview" icon={<Code size={15} />}>
            <div className="pt-3 space-y-4">
              <p className="text-sm text-pine-forest leading-relaxed">{report.project_overview}</p>

              {pa && (
                <>
                  {pa.project_title && (
                    <div className="p-3 bg-pine-cream rounded-xl border border-pine-border">
                      <p className="text-sm font-bold text-pine-forest">
                        {pa.project_title}
                        {pa.problem_addressed && (
                          <span className="text-xs font-normal text-pine-slate-light ml-2">— {pa.problem_addressed}</span>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {pa.frontend_technologies?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Frontend Stack</p>
                        <div className="flex flex-wrap gap-1">
                          {pa.frontend_technologies.map(t => <SkillBadge key={t} label={t} />)}
                        </div>
                      </div>
                    )}
                    {pa.backend_technologies?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">Backend Stack</p>
                        <div className="flex flex-wrap gap-1">
                          {pa.backend_technologies.map(t => <SkillBadge key={t} label={t} />)}
                        </div>
                      </div>
                    )}
                  </div>

                  {pa.architecture_overview && (
                    <div>
                      <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-1">Architecture Highlights</p>
                      <p className="text-sm text-pine-forest leading-relaxed">{pa.architecture_overview}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Section>

          {/* Strengths */}
          {report.strengths?.length > 0 && (
            <Section title="Key Strengths with Evidence" icon={<Star size={15} />}>
              <div className="pt-3 space-y-3">
                {report.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
                    <Star size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-pine-forest">{s.claim}</p>
                      {s.excerpt && (
                        <p className="text-xs text-pine-slate mt-1 italic">"{s.excerpt}"</p>
                      )}
                      <div className="mt-2">
                        <EvidencePill confidence={s.confidence} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Suggested Interview Questions */}
          {report.interview_questions?.length > 0 && (
            <Section title="Suggested Clarification Questions for Interview Rounds" icon={<HelpCircle size={15} />}>
              <div className="pt-3 space-y-3">
                {report.interview_questions.map((q, i) => (
                  <div key={i} className="border border-pine-border rounded-xl overflow-hidden bg-white shadow-xs">
                    <div className="px-4 py-3 bg-pine-cream/70 flex items-start gap-3 border-b border-pine-border">
                      <span className="w-5 h-5 rounded-full bg-pine-forest text-pine-lime text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm font-bold text-pine-forest">{q.question}</p>
                    </div>
                    <div className="p-4 space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-pine-slate-light">Why ask this: </span>
                        <span className="text-pine-forest">{q.relevance}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-800">Strong answer demonstrates: </span>
                        <span className="text-pine-forest">{q.strong_answer_demonstrates}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Rubric Assessments */}
          {report.rubric_assessments?.length > 0 && (
            <Section title="Technical Review Rubric & Dimension Scores" icon={<BarChart2 size={15} />} defaultOpen={false}>
              <div className="pt-3 space-y-4">
                {report.rubric_assessments.map((r, i) => (
                  <div key={i} className="p-4 bg-pine-cream/50 rounded-xl border border-pine-border">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm font-bold text-pine-forest">{r.dimension}</p>
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
                    {r.notes && <p className="text-xs text-pine-forest mt-2">{r.notes}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Limitations */}
          {report.limitations?.length > 0 && (
            <Section title="Static Evaluation Limitations" icon={<AlertCircle size={15} />} defaultOpen={false}>
              <div className="pt-3">
                <p className="text-xs text-pine-slate-light mb-3">
                  The following aspects could not be determined strictly from static file inspection and should be verified in the interview:
                </p>
                <ul className="space-y-2">
                  {report.limitations.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-pine-forest">
                      <div className="w-1.5 h-1.5 rounded-full bg-pine-forest flex-shrink-0 mt-1" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          )}

          {/* Footer Metadata */}
          <div className="pt-4 border-t border-pine-border flex flex-wrap items-center justify-between text-[11px] text-pine-slate-light">
            <span>Model: {String(report.processing_metadata?.model_used || 'Groq Llama-3.3-70b')}</span>
            <span>Generated: {new Date().toLocaleDateString('en-IN')}</span>
            <span>Pine Labs Talent Intelligence System</span>
          </div>
        </div>
      </div>

      {/* Review Checklist Modal */}
      {showChecklistModal && (
        <ReviewChecklistModal
          candidate={candidateItem}
          onClose={() => setShowChecklistModal(false)}
          onSuccess={(updated) => {
            setSuccessBanner(`Review checklist saved for ${candidate.name}!`)
            if (updated?.review_status) {
              setReviewStatus(updated.review_status)
            }
          }}
          onOpenInvitation={() => {
            setShowChecklistModal(false)
            setShowInvitationModal(true)
          }}
        />
      )}

      {/* Shortlist Email Invitation Modal */}
      {showInvitationModal && (
        <InvitationModal
          candidates={[candidateItem]}
          onClose={() => setShowInvitationModal(false)}
          onSuccess={() => {
            setSuccessBanner(`Interview invitation email successfully dispatched to ${candidate.email}!`)
            setReviewStatus('shortlisted')
            setEmailSent(true)
          }}
        />
      )}
    </div>
  )
}
