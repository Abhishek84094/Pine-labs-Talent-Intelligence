import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Mail, Phone, Briefcase, GitBranch, Link2, Globe,
  FileText, Archive, ArrowRight, ArrowLeft, AlertCircle,
  Info, ChevronRight, CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import StepIndicator from '../components/StepIndicator'
import FileUpload from '../components/FileUpload'
import { submissionApi } from '../services/api'
import type { CandidateFormData } from '../types'

const candidateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Enter a valid phone number').max(50),
  job_role: z.string().min(2, 'Please specify the role you are applying for').max(200),
  github_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

type FormData = z.infer<typeof candidateSchema>

const STEPS = [
  { number: 1, label: 'Your Info' },
  { number: 2, label: 'Resume' },
  { number: 3, label: 'Project' },
  { number: 4, label: 'Review' },
]

const JOB_ROLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Backend Engineer',
  'Frontend Engineer',
  'Full Stack Engineer',
  'Data Engineer',
  'ML Engineer',
  'DevOps Engineer',
  'Platform Engineer',
  'Product Manager',
  'Data Scientist',
  'Other',
]

/* Small field wrapper for consistent layout */
function Field({ label, required, error, children }: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-status-error ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="error-text">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}

/* Pill for step headers */
function StepBadge({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-8 h-8 rounded-full bg-pine-lime text-pine-forest text-sm font-bold flex items-center justify-center flex-shrink-0">
        {num}
      </span>
      <h2 className="text-xl font-bold text-pine-forest">{label}</h2>
    </div>
  )
}

export default function SubmissionPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [projectFile, setProjectFile] = useState<File | null>(null)
  const [resumeError, setResumeError] = useState('')
  const [projectError, setProjectError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(candidateSchema),
    mode: 'onBlur',
  })

  const goToStep = async (next: number) => {
    if (next > step) {
      if (step === 1) {
        const valid = await trigger(['full_name', 'email', 'phone', 'job_role'])
        if (!valid) return
      }
      if (step === 2) {
        if (!resumeFile) {
          setResumeError('Please upload your resume to continue.')
          return
        }
        setResumeError('')
      }
      if (step === 3) {
        if (!projectFile) {
          setProjectError('Please upload your project ZIP to continue.')
          return
        }
        setProjectError('')
      }
    }
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (data: FormData) => {
    if (!resumeFile || !projectFile) {
      setSubmitError('Both resume and project ZIP are required.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setUploadProgress(0)

    try {
      const candidateData: CandidateFormData = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        job_role: data.job_role,
        github_url: data.github_url || undefined,
        linkedin_url: data.linkedin_url || undefined,
        portfolio_url: data.portfolio_url || undefined,
      }

      const response = await submissionApi.submit(
        candidateData,
        resumeFile,
        projectFile,
        setUploadProgress
      )

      navigate(`/confirmation/${response.id}`, {
        state: { full_name: data.full_name }
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  const values = getValues()

  return (
    <div className="min-h-screen bg-pine-cream">
      <Navbar variant="form" />

      {/* Hero band */}
      <div className="bg-pine-forest-deep text-white">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-pine-lime text-xs font-semibold mb-3 uppercase tracking-widest">
            <div className="w-4 h-px bg-pine-lime" />
            Application Form
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Submit Your Application
          </h1>
          <p className="text-white/50 text-sm max-w-lg leading-relaxed">
            Share your resume and a project you are proud of. The hiring team will
            review your submission — no automated gatekeeping.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-pine-border sticky top-14 z-30">
        <div className="max-w-3xl mx-auto px-6 py-5 flex justify-center">
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>
      </div>

      {/* Form content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* ── Step 1: Candidate Info ── */}
          {step === 1 && (
            <div className="card p-6 sm:p-8 animate-slide-up">
              <StepBadge num={1} label="Your Information" />
              <p className="text-sm text-pine-slate mb-6">
                Tell us about yourself. This helps us identify your application and reach you.
              </p>

              <div className="space-y-5">
                <Field label="Full Name" required error={errors.full_name?.message}>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
                    <input
                      id="full_name"
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      className={`input-field pl-10 ${errors.full_name ? 'input-error' : ''}`}
                      {...register('full_name')}
                    />
                  </div>
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Email Address" required error={errors.email?.message}>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className={`input-field pl-10 ${errors.email ? 'input-error' : ''}`}
                        {...register('email')}
                      />
                    </div>
                  </Field>

                  <Field label="Phone Number" required error={errors.phone?.message}>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        className={`input-field pl-10 ${errors.phone ? 'input-error' : ''}`}
                        {...register('phone')}
                      />
                    </div>
                  </Field>
                </div>

                <Field label="Role Applied For" required error={errors.job_role?.message}>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light z-10" />
                    <input
                      id="job_role"
                      type="text"
                      list="job-roles"
                      placeholder="e.g. Software Engineer — Platform & Payments"
                      className={`input-field pl-10 ${errors.job_role ? 'input-error' : ''}`}
                      {...register('job_role')}
                    />
                    <datalist id="job-roles">
                      {JOB_ROLES.map(r => <option key={r} value={r} />)}
                    </datalist>
                  </div>
                </Field>

                <div className="border-t border-pine-border pt-5">
                  <p className="text-sm font-semibold text-pine-forest mb-3">
                    Professional Links <span className="text-pine-slate-light font-normal text-xs">(optional)</span>
                  </p>
                  <div className="space-y-3">
                    <div className="relative">
                      <GitBranch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
                      <input
                        type="url"
                        placeholder="https://github.com/yourusername"
                        className={`input-field pl-10 ${errors.github_url ? 'input-error' : ''}`}
                        {...register('github_url')}
                      />
                      {errors.github_url && <p className="error-text"><AlertCircle size={12} />{errors.github_url.message}</p>}
                    </div>
                    <div className="relative">
                      <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile"
                        className={`input-field pl-10 ${errors.linkedin_url ? 'input-error' : ''}`}
                        {...register('linkedin_url')}
                      />
                      {errors.linkedin_url && <p className="error-text"><AlertCircle size={12} />{errors.linkedin_url.message}</p>}
                    </div>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
                      <input
                        type="url"
                        placeholder="https://yourportfolio.com"
                        className={`input-field pl-10 ${errors.portfolio_url ? 'input-error' : ''}`}
                        {...register('portfolio_url')}
                      />
                      {errors.portfolio_url && <p className="error-text"><AlertCircle size={12} />{errors.portfolio_url.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button type="button" onClick={() => goToStep(2)} className="btn-primary">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Resume ── */}
          {step === 2 && (
            <div className="card p-6 sm:p-8 animate-slide-up">
              <StepBadge num={2} label="Upload Your Resume" />
              <p className="text-sm text-pine-slate mb-6">
                Upload a current PDF or DOCX resume covering your experience, skills, and projects.
              </p>

              <FileUpload
                id="resume"
                label="Resume"
                accept=".pdf,.docx"
                maxSizeMB={10}
                file={resumeFile}
                onFileChange={setResumeFile}
                error={resumeError}
                allowedExtensions={['.pdf', '.docx']}
                icon={<FileText size={22} className="text-pine-slate-light" />}
                hint={
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-pine-forest flex items-center gap-1.5">
                      <Info size={12} className="text-pine-forest" /> What we look for
                    </p>
                    <ul className="text-xs text-pine-slate-light space-y-0.5 ml-4 list-disc">
                      <li>Work experience and internships</li>
                      <li>Technical skills and programming languages</li>
                      <li>Projects and technologies used</li>
                      <li>Education and certifications</li>
                    </ul>
                  </div>
                }
              />

              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => goToStep(1)} className="btn-secondary">
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" onClick={() => goToStep(3)} className="btn-primary">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Project ── */}
          {step === 3 && (
            <div className="card p-6 sm:p-8 animate-slide-up">
              <StepBadge num={3} label="Upload Your Project" />
              <p className="text-sm text-pine-slate mb-6">
                Share a project you are proud of. Include a README explaining your thinking and design choices.
              </p>

              <FileUpload
                id="project_zip"
                label="Project ZIP Archive"
                accept=".zip"
                maxSizeMB={50}
                file={projectFile}
                onFileChange={setProjectFile}
                error={projectError}
                allowedExtensions={['.zip']}
                icon={<Archive size={22} className="text-pine-slate-light" />}
                hint={
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-pine-forest flex items-center gap-1.5">
                      <Info size={12} className="text-pine-forest" /> What to include
                    </p>
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {[
                        '✓ README describing the project',
                        '✓ Source code files',
                        '✓ requirements.txt / package.json',
                        '✓ Configuration files',
                        '✓ Tests (if available)',
                        '✓ Problem statement',
                      ].map(item => (
                        <p key={item} className="text-xs text-pine-slate-light">{item}</p>
                      ))}
                    </div>
                    <p className="text-xs text-pine-slate-light border-t border-pine-border pt-2 mt-1">
                      <span className="font-semibold text-pine-forest">Privacy note:</span> Your code is
                      reviewed by the hiring team and not stored beyond this hiring process.
                    </p>
                  </div>
                }
              />

              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => goToStep(2)} className="btn-secondary">
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" onClick={() => goToStep(4)} className="btn-primary">
                  Review <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Submit ── */}
          {step === 4 && (
            <div className="space-y-4 animate-slide-up">
              <div className="card p-6 sm:p-8">
                <StepBadge num={4} label="Review Your Application" />

                {/* Candidate info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-pine-slate uppercase tracking-widest">
                      Personal Information
                    </h3>
                    <button type="button" onClick={() => setStep(1)}
                      className="text-xs text-pine-forest hover:underline font-semibold">
                      Edit
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Full Name', value: values.full_name },
                      { label: 'Email', value: values.email },
                      { label: 'Phone', value: values.phone },
                      { label: 'Role Applied', value: values.job_role },
                      ...(values.github_url ? [{ label: 'GitHub', value: values.github_url }] : []),
                      ...(values.linkedin_url ? [{ label: 'LinkedIn', value: values.linkedin_url }] : []),
                      ...(values.portfolio_url ? [{ label: 'Portfolio', value: values.portfolio_url }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-pine-cream rounded-xl p-3">
                        <p className="text-xs text-pine-slate-light font-medium">{label}</p>
                        <p className="text-sm font-semibold text-pine-forest mt-0.5 break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-pine-border my-6" />

                {/* Files */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-pine-slate uppercase tracking-widest mb-3">
                    Uploaded Files
                  </h3>
                  {resumeFile && (
                    <div className="flex items-center gap-3 p-3 bg-pine-lime-light border border-pine-lime/30 rounded-xl">
                      <div className="w-9 h-9 rounded-xl bg-pine-lime/30 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-pine-forest" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-pine-forest truncate">{resumeFile.name}</p>
                        <p className="text-xs text-pine-slate">Resume · {(resumeFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <CheckCircle2 size={16} className="text-pine-forest flex-shrink-0" />
                      <button type="button" onClick={() => { setResumeFile(null); setStep(2) }}
                        className="text-xs text-pine-slate hover:text-pine-forest font-medium ml-1">Replace</button>
                    </div>
                  )}
                  {projectFile && (
                    <div className="flex items-center gap-3 p-3 bg-pine-lime-light border border-pine-lime/30 rounded-xl">
                      <div className="w-9 h-9 rounded-xl bg-pine-lime/30 flex items-center justify-center flex-shrink-0">
                        <Archive size={16} className="text-pine-forest" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-pine-forest truncate">{projectFile.name}</p>
                        <p className="text-xs text-pine-slate">Project ZIP · {(projectFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <CheckCircle2 size={16} className="text-pine-forest flex-shrink-0" />
                      <button type="button" onClick={() => { setProjectFile(null); setStep(3) }}
                        className="text-xs text-pine-slate hover:text-pine-forest font-medium ml-1">Replace</button>
                    </div>
                  )}
                </div>

                <div className="border-t border-pine-border my-6" />

                {/* Privacy */}
                <div className="bg-pine-cream rounded-xl p-4">
                  <p className="text-xs text-pine-slate leading-relaxed">
                    <span className="font-semibold text-pine-forest">Privacy Notice: </span>
                    Your submitted files will be processed by Pine Labs' internal evaluation
                    system for the sole purpose of this hiring process. Files are not shared externally.
                  </p>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle size={16} className="text-status-error flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-status-error">{submitError}</p>
                  </div>
                )}

                {/* Upload progress */}
                {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-pine-slate mb-1.5">
                      <span>Uploading files…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-pine-cream rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pine-lime rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  <button type="button" onClick={() => goToStep(3)} className="btn-secondary" disabled={isSubmitting}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button type="submit" className="btn-primary min-w-[180px]" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="spinner w-4 h-4" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit Application <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
