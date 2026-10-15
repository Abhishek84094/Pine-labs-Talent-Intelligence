import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { CheckCircle, Copy, Check, FileCheck, Clock, ShieldCheck, Mail, ArrowRight } from 'lucide-react'
import Header from '../components/Header'

export default function ConfirmationPage() {
  const location = useLocation()
  const [copied, setCopied] = useState(false)

  const referenceId = (location.state as { reference_id?: string })?.reference_id || 'PL-SUBMISSION'
  const fullName = (location.state as { full_name?: string })?.full_name || 'Candidate'

  const copyRefId = () => {
    navigator.clipboard.writeText(referenceId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-pine-cream">
      <Header />

      <div className="max-w-2xl mx-auto px-6 py-14">
        {/* Success Banner */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-pine-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-green">
            <CheckCircle size={36} className="text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-pine-navy">
            Application Submitted Successfully!
          </h1>
          <p className="text-pine-slate text-sm max-w-md mx-auto mt-2">
            Thank you, <span className="font-semibold text-pine-navy">{fullName}</span>. Your application, resume, and project submission have been securely received.
          </p>
        </div>

        {/* Reference ID Receipt Card */}
        <div className="card p-6 mb-6 animate-slide-up">
          <div className="text-center">
            <p className="text-xs font-semibold text-pine-slate-light uppercase tracking-wider mb-2">
              Application Reference ID
            </p>
            <div className="inline-flex items-center justify-center gap-3 bg-pine-cream px-5 py-3 rounded-xl border border-pine-border">
              <span className="text-2xl sm:text-3xl font-bold text-pine-navy tracking-widest font-mono">
                {referenceId}
              </span>
              <button
                onClick={copyRefId}
                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-pine-border transition-all"
                title="Copy reference ID"
              >
                {copied ? <Check size={18} className="text-pine-green" /> : <Copy size={18} className="text-pine-slate-light hover:text-pine-navy" />}
              </button>
            </div>
            <p className="text-xs text-pine-slate-light mt-3">
              Please save this reference ID for any future correspondence regarding your application.
            </p>
          </div>
        </div>

        {/* What Happens Next Card */}
        <div className="card p-6 mb-6 animate-slide-up animation-delay-100">
          <h2 className="text-sm font-bold text-pine-navy uppercase tracking-wider mb-5 flex items-center gap-2">
            <Clock size={16} className="text-pine-green" />
            What Happens Next?
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-pine-green-light text-pine-green flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-pine-navy">Submission Logged & Verified</p>
                <p className="text-xs text-pine-slate mt-0.5">
                  Your resume and project code artifacts have been securely indexed in our candidate database.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-pine-cream text-pine-navy flex items-center justify-center flex-shrink-0 font-bold text-xs border border-pine-border mt-0.5">
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-pine-navy">Technical Review by Hiring Team</p>
                <p className="text-xs text-pine-slate mt-0.5">
                  The Pine Labs engineering team will review your project architecture, code practices, and experience against the role requirements.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-pine-cream text-pine-navy flex items-center justify-center flex-shrink-0 font-bold text-xs border border-pine-border mt-0.5">
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-pine-navy">Recruiter Contact & Next Steps</p>
                <p className="text-xs text-pine-slate mt-0.5">
                  If your profile matches our team's technical expectations, our talent acquisition team will reach out via email or phone to schedule an interview.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Confidentiality Notice */}
        <div className="p-4 bg-white border border-pine-border rounded-xl flex items-start gap-3 mb-6">
          <ShieldCheck size={18} className="text-pine-green flex-shrink-0 mt-0.5" />
          <p className="text-xs text-pine-slate leading-relaxed">
            <strong className="text-pine-navy font-semibold">Confidentiality Guarantee:</strong> Your submitted code archive is processed strictly for technical screening evaluation within Pine Labs and is never redistributed or retained beyond the hiring process.
          </p>
        </div>

        {/* Actions */}
        <div className="text-center space-y-3 animate-slide-up animation-delay-200">
          <Link to="/" className="btn-secondary w-full justify-center">
            Submit Another Application
          </Link>
          <p className="text-xs text-pine-slate-light">
            Questions? Contact Pine Labs Careers at <span className="font-medium text-pine-navy">careers@pinelabs.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
