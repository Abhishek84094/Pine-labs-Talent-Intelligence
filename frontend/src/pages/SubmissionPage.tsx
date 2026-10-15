import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Mail, Phone, Briefcase, GitBranch, Link2, Globe,
  FileText, Archive, ArrowRight, ArrowLeft, AlertCircle,
  Info, ChevronRight,
} from 'lucide-react'
import Header from '../components/Header'
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
        state: { reference_id: response.reference_id, full_name: data.full_name }
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  const values = getValues()

  return (
    <div className="min-h-screen bg-pine-cream">
      <Header />

      {/* Hero */}
      <div className="bg-pine-navy text-white">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-pine-green text-xs font-semibold mb-3 uppercase tracking-wider">
            <div className="w-4 h-0.5 bg-pine-green" />
            Technical Hiring
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Submit Your Application
          </h1>
          <p className="text-pine-slate-light text-sm max-w-lg">
            Share your resume and a project you're proud of. Our platform will prepare a
            technical overview to help the Pine Labs team understand your work before the interview.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-pine-border">
        <div className="max-w-3xl mx-auto px-6 py-5 flex justify-center">
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Step 1: Candidate Info */}
          {step === 1 && (
            <div className="card p-6 sm:p-8 animate-slide-up">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-pine-navy">Your Information</h2>
                <p className="text-sm text-pine-slate-light mt-1">
                  Tell us a bit about yourself. This information will be used to identify your application.
                </p>
              </div>

              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="label">
                    Full Name <span className="text-status-error">*</span>
                  </label>
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
                  {errors.full_name && (
                    <p className="error-text"><AlertCircle size={12} />{errors.full_name.message}</p>
                  )}
                </div>

                {/* Email & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="label">
                      Email Address <span className="text-status-error">*</span>
                    </label>
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
                    {errors.email && (
                      <p className="error-text"><AlertCircle size={12} />{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="label">
                      Phone Number <span className="text-status-error">*</span>
                    </label>
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
                    {errors.phone && (
                      <p className="error-text"><AlertCircle size={12} />{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Job Role */}
                <div>
                  <label htmlFor="job_role" className="label">
                    Role Applied For <span className="text-status-error">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light z-10" />
                    <input
                      id="job_role"
                      type="text"
                      list="job-roles"
                      placeholder="e.g. Software Engineer"
                      className={`input-field pl-10 ${errors.job_role ? 'input-error' : ''}`}
                      {...register('job_role')}
                    />
                    <datalist id="job-roles">
                      {JOB_ROLES.map(r => <option key={r} value={r} />)}
                    </datalist>
                  </div>
                  {errors.job_role && (
                    <p className="error-text"><AlertCircle size={12} />{errors.job_role.message}</p>
                  )}
                </div>

                {/* Social links */}
                <div className="divider pt-1" />
                <div>
                  <p className="text-sm font-semibold text-pine-navy mb-3">
                    Professional Links <span className="text-pine-slate-light font-normal">(optional)</span>
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="relative">
                        <GitBranch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
                        <input
                          type="url"
                          placeholder="https://github.com/yourusername"
                          className={`input-field pl-10 ${errors.github_url ? 'input-error' : ''}`}
                          {...register('github_url')}
                        />
                      </div>
                      {errors.github_url && (
                        <p className="error-text"><AlertCircle size={12} />{errors.github_url.message}</p>
                      )}
                    </div>
                    <div>
                      <div className="relative">
                        <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/yourprofile"
                          className={`input-field pl-10 ${errors.linkedin_url ? 'input-error' : ''}`}
                          {...register('linkedin_url')}
                        />
                      </div>
                      {errors.linkedin_url && (
                        <p className="error-text"><AlertCircle size={12} />{errors.linkedin_url.message}</p>
                      )}
                    </div>
                    <div>
                      <div className="relative">
                        <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pine-slate-light" />
                        <input
                          type="url"
                          placeholder="https://yourportfolio.com"
                          className={`input-field pl-10 ${errors.portfolio_url ? 'input-error' : ''}`}
                          {...register('portfolio_url')}
                        />
                      </div>
                      {errors.portfolio_url && (
                        <p className="error-text"><AlertCircle size={12} />{errors.portfolio_url.message}</p>
                      )}
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

          {/* Step 2: Resume */}
          {step === 2 && (
            <div className="card p-6 sm:p-8 animate-slide-up">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-pine-navy">Upload Your Resume</h2>
                <p className="text-sm text-pine-slate-light mt-1">
                  Your resume will be analyzed to extract your experience, skills, and projects.
                </p>
              </div>

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
                    <p className="text-xs font-semibold text-pine-navy flex items-center gap-1.5">
                      <Info size={12} className="text-pine-green" /> What we look for in your resume
                    </p>
                    <ul className="text-xs text-pine-slate-light space-y-0.5 ml-4 list-disc">
                      <li>Work experience and internships</li>
                      <li>Technical skills and programming languages</li>
                      <li>Projects and their technologies</li>
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

          {/* Step 3: Project ZIP */}
          {step === 3 && (
            <div className="card p-6 sm:p-8 animate-slide-up">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-pine-navy">Upload Your Project</h2>
                <p className="text-sm text-pine-slate-light mt-1">
                  Share a software project you're proud of. It will be analyzed statically — your code will never be executed.
                </p>
              </div>

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
                    <p className="text-xs font-semibold text-pine-navy flex items-center gap-1.5">
                      <Info size={12} className="text-pine-green" /> What to include in your ZIP
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {[
                        '✓ README describing the project',
                        '✓ Source code files',
                        '✓ requirements.txt / package.json',
                        '✓ Configuration files',
                        '✓ Tests (if available)',
                        '✓ Problem statement or description',
                      ].map(item => (
                        <p key={item} className="text-xs text-pine-slate-light">{item}</p>
                      ))}
                    </div>
                    <p className="text-xs text-pine-slate-light border-t border-pine-border pt-2 mt-1">
                      <span className="font-semibold text-pine-navy">Privacy note:</span> Your code
                      is analyzed using a configured LLM for evaluation purposes and is not stored
                      beyond this hiring process.
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

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4 animate-slide-up">
              <div className="card p-6 sm:p-8">
                <h2 className="text-xl font-bold text-pine-navy mb-6">Review Your Application</h2>

                {/* Candidate info review */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-pine-navy uppercase tracking-wider text-xs">
                      Personal Information
                    </h3>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-pine-green hover:underline font-medium">
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
                        <p className="text-sm font-semibold text-pine-navy mt-0.5 break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divider my-6" />

                {/* Files review */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-pine-navy uppercase tracking-wider">
                      Uploaded Files
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {resumeFile && (
                      <div className="flex items-center gap-3 p-3 bg-pine-green-light rounded-xl">
                        <FileText size={18} className="text-pine-green flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-pine-navy truncate">{resumeFile.name}</p>
                          <p className="text-xs text-pine-slate-light">Resume · {(resumeFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button type="button" onClick={() => { setResumeFile(null); setStep(2) }}
                          className="text-xs text-pine-slate-light hover:text-pine-navy">Replace</button>
                      </div>
                    )}
                    {projectFile && (
                      <div className="flex items-center gap-3 p-3 bg-pine-green-light rounded-xl">
                        <Archive size={18} className="text-pine-green flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-pine-navy truncate">{projectFile.name}</p>
                          <p className="text-xs text-pine-slate-light">Project ZIP · {(projectFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button type="button" onClick={() => { setProjectFile(null); setStep(3) }}
                          className="text-xs text-pine-slate-light hover:text-pine-navy">Replace</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="divider my-6" />

                {/* Privacy notice */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Privacy Notice:</span> Your submitted files will
                    be processed by Pine Labs' AI evaluation system using the Groq API for the
                    sole purpose of this hiring evaluation. Files are not shared externally beyond
                    the configured LLM provider.
                  </p>
                </div>

                {/* Submit error */}
                {submitError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle size={16} className="text-status-error flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-status-error">{submitError}</p>
                  </div>
                )}

                {/* Upload progress */}
                {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-pine-slate mb-1">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-pine-cream rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pine-green rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  <button type="button" onClick={() => goToStep(3)} className="btn-secondary" disabled={isSubmitting}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn-primary min-w-[160px]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner w-4 h-4" />
                        Submitting...
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
