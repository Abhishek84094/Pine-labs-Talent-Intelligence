import { useLocation, Link } from 'react-router-dom'
import { CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function ConfirmationPage() {
  const location = useLocation()
  const fullName = (location.state as { full_name?: string })?.full_name || 'Candidate'

  return (
    <div className="min-h-screen bg-pine-cream">
      <Navbar variant="form" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-14">

        {/* Success banner */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-pine-lime rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lime">
            <CheckCircle2 size={36} className="sm:w-10 sm:h-10 text-pine-forest" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-pine-forest">
            Application Submitted!
          </h1>
          <p className="text-pine-slate text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed">
            Thank you, <span className="font-semibold text-pine-forest">{fullName}</span>.
            Your resume and project have been securely received. The hiring team will be in touch.
          </p>
        </div>

        {/* What happens next */}
        <div className="card p-4 sm:p-6 mb-5 animate-slide-up animation-delay-100">
          <h2 className="text-xs font-bold text-pine-slate uppercase tracking-widest mb-5 flex items-center gap-2">
            <Clock size={14} className="text-pine-forest" />
            What happens next
          </h2>

          <div className="space-y-5">
            {[
              {
                num: 1,
                title: 'Submission logged & verified',
                desc: 'Your resume and project archive have been securely indexed in our candidate system.',
                done: true,
              },
              {
                num: 2,
                title: 'Technical review by the hiring team',
                desc: 'The Pine Labs engineering team will review your project architecture, code quality, and experience.',
                done: false,
              },
              {
                num: 3,
                title: 'Recruiter contact & next steps',
                desc: 'If your profile matches what the team is looking for, our talent team will reach out to schedule an interview.',
                done: false,
              },
            ].map(({ num, title, desc, done }) => (
              <div key={num} className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5 ${
                  done
                    ? 'bg-pine-lime text-pine-forest'
                    : 'bg-pine-cream text-pine-slate border border-pine-border'
                }`}>
                  {done ? <CheckCircle2 size={14} /> : num}
                </div>
                <div>
                  <p className="text-sm font-semibold text-pine-forest">{title}</p>
                  <p className="text-xs text-pine-slate mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidentiality */}
        <div className="p-4 bg-white border border-pine-border rounded-2xl flex items-start gap-3 mb-8 animate-slide-up animation-delay-200">
          <ShieldCheck size={18} className="text-pine-forest flex-shrink-0 mt-0.5" />
          <p className="text-xs text-pine-slate leading-relaxed">
            <strong className="text-pine-forest font-semibold">Confidentiality Guarantee: </strong>
            Your submitted code is processed strictly for technical screening within Pine Labs
            and is never redistributed or retained beyond this hiring process.
          </p>
        </div>

        {/* Actions */}
        <div className="text-center space-y-3 animate-slide-up animation-delay-300">
          <Link to="/" className="btn-primary-dark w-full justify-center text-sm">
            Back to Job Listing <ArrowRight size={15} />
          </Link>
          <Link to="/submit" className="btn-secondary w-full justify-center text-sm">
            Submit Another Application
          </Link>
          <p className="text-xs text-pine-slate-light">
            Questions? Email <span className="font-medium text-pine-forest">careers@pinelabs.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
