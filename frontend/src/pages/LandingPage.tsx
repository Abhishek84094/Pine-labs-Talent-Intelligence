import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Globe,
  Server,
  TrendingUp,
  Wallet,
  FileText,
  Archive,
  Users,
  Zap,
  Shield,
  ChevronDown,
  MapPin,
  Briefcase,
  Clock,
} from 'lucide-react'
import { ROLE_CONFIG, COMPANY_CAPABILITIES, COMPANY_VALUES, APPLICATION_STEPS } from '../data/roleConfig'
import Navbar from '../components/Navbar'
import { useReveal, useCounter } from '../hooks/useReveal'

/* ─── SVG capability icons ─── */
const capabilityIcons: Record<string, React.ReactNode> = {
  Globe: <Globe size={24} />,
  CreditCard: <CreditCard size={24} />,
  Wallet: <Wallet size={24} />,
  Server: <Server size={24} />,
  TrendingUp: <TrendingUp size={24} />,
}

/* ─── Stat counter card ─── */
function StatCounter({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const ref = useCounter(value, 1400)
  return (
    <div className="text-center">
      <div className="text-4xl lg:text-5xl font-bold text-pine-lime leading-none">
        <span ref={ref}>0</span>
        {suffix && <span>{suffix}</span>}
      </div>
      <div className="text-sm text-white/50 mt-1.5 font-medium">{label}</div>
    </div>
  )
}

/* ─── Reveal wrapper ─── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal()
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ─── Checklist item ─── */
function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-pine-slate leading-relaxed">
      <CheckCircle2 size={16} className="text-pine-forest mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </li>
  )
}

/* ─── Skill pill ─── */
function SkillPill({ label, preferred }: { label: string; preferred?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
      preferred
        ? 'bg-pine-lime/10 border-pine-lime/30 text-pine-forest'
        : 'bg-pine-forest/5 border-pine-border text-pine-slate'
    }`}>
      {preferred && <Zap size={10} className="text-pine-forest" />}
      {label}
    </span>
  )
}

export default function LandingPage() {
  const scrollToApply = () => {
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="landing" />

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative bg-pine-forest-deep min-h-screen flex flex-col justify-center overflow-hidden">

        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-forest opacity-100" />

        {/* Decorative gradient blobs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-pine-lime/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-pine-mint/10 rounded-full blur-3xl" />

        {/* Animated flow lines SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            className="flow-line"
            d="M0 60% Q25% 40% 50% 60% T100% 40%"
            fill="none"
            stroke="rgba(208,242,85,0.07)"
            strokeWidth="1.5"
          />
          <path
            className="flow-line flow-line-2"
            d="M0 70% Q30% 50% 60% 70% T100% 55%"
            fill="none"
            stroke="rgba(19,187,202,0.06)"
            strokeWidth="1.5"
          />
          <path
            className="flow-line flow-line-3"
            d="M0 80% Q40% 60% 70% 75% T100% 65%"
            fill="none"
            stroke="rgba(208,242,85,0.04)"
            strokeWidth="1"
          />
        </svg>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24 flex flex-col lg:flex-row gap-16 items-center">

          {/* Left: text */}
          <div className="flex-1 max-w-2xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-6 animate-fade-in animation-fill-both">
              <span className="w-6 h-px bg-pine-lime" />
              <span className="section-eyebrow">Open Opportunity</span>
            </div>

            {/* Headline */}
            <h1 className="hero-headline text-white mb-5 animate-fade-up animation-fill-both animation-delay-100">
              Build the infrastructure<br />
              <span className="text-pine-lime">behind every payment.</span>
            </h1>

            {/* Role summary */}
            <p className="text-base lg:text-lg text-white/60 leading-relaxed mb-8 max-w-xl animate-fade-up animation-fill-both animation-delay-200">
              {ROLE_CONFIG.overview.slice(0, 180).trim()}…
            </p>

            {/* Meta tags */}
            <div className="flex flex-wrap gap-3 mb-10 animate-fade-up animation-fill-both animation-delay-300">
              <div className="flex items-center gap-1.5 text-white/50 text-sm">
                <Briefcase size={14} />
                <span>{ROLE_CONFIG.title}</span>
              </div>
              <div className="w-px bg-white/15" />
              <div className="flex items-center gap-1.5 text-white/50 text-sm">
                <MapPin size={14} />
                <span>{ROLE_CONFIG.location}</span>
              </div>
              <div className="w-px bg-white/15" />
              <div className="flex items-center gap-1.5 text-white/50 text-sm">
                <Clock size={14} />
                <span>{ROLE_CONFIG.employmentType}</span>
              </div>
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap gap-3 animate-fade-up animation-fill-both animation-delay-400">
              <button onClick={scrollToApply} className="btn-primary text-base px-8 py-3.5 shadow-lime animate-pulse-lime">
                Apply Now
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => document.getElementById('role')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-outline-white text-sm"
              >
                See the role
              </button>
            </div>
          </div>

          {/* Right: stats card */}
          <div className="lg:flex-shrink-0 w-full lg:w-auto animate-fade-up animation-fill-both animation-delay-500">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm grid grid-cols-2 gap-8 min-w-[300px]">
              <StatCounter value={10} suffix="M+" label="Merchants served" />
              <StatCounter value={150} suffix="M+" label="Transactions daily" />
              <StatCounter value={500} suffix="+" label="Banks & NBFCs" />
              <StatCounter value={3500} suffix="+" label="Team members" />
            </div>
            <p className="text-center text-white/25 text-xs mt-3 font-medium">
              Pine Labs at a glance · 2024
            </p>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 animate-bounce">
          <ChevronDown size={22} />
        </div>
      </section>

      {/* ════════════════════════════════════════
          ABOUT / CAPABILITIES
      ════════════════════════════════════════ */}
      <section id="about" className="section-padding bg-white">
        <div className="section-container">
          <Reveal className="text-center mb-16">
            <p className="section-eyebrow-dark mb-3">Technology behind everyday commerce</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-pine-forest max-w-2xl mx-auto text-balance">
              We move money for millions of merchants
            </h2>
            <p className="text-pine-slate mt-4 max-w-xl mx-auto text-base leading-relaxed">
              Pine Labs is India's leading merchant platform — unifying in-store, online, and
              alternative payment experiences at enterprise scale across Asia.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COMPANY_CAPABILITIES.map((cap, i) => (
              <Reveal key={cap.id} delay={i * 80}>
                <a
                  href={cap.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="capability-card block group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-pine-forest/5 flex items-center justify-center text-pine-forest mb-4 group-hover:bg-pine-lime/20 transition-colors">
                    {capabilityIcons[cap.icon]}
                  </div>
                  <h3 className="font-bold text-pine-forest mb-1.5 text-base group-hover:text-pine-forest transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-pine-slate leading-relaxed">{cap.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-pine-forest text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight size={12} />
                  </div>
                </a>
              </Reveal>
            ))}

            {/* Engineering card */}
            <Reveal delay={COMPANY_CAPABILITIES.length * 80}>
              <div className="capability-card bg-pine-forest text-white border-pine-forest hover:bg-pine-forest-mid">
                <div className="w-12 h-12 rounded-2xl bg-pine-lime/20 flex items-center justify-center text-pine-lime mb-4">
                  <Zap size={24} />
                </div>
                <h3 className="font-bold mb-1.5 text-base">Engineering Platform</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Distributed services, real-time data, and resilient infrastructure engineered for 99.99% uptime.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          ROLE DESCRIPTION
      ════════════════════════════════════════ */}
      <section id="role" className="section-padding bg-pine-cream">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left: header + overview */}
            <div className="lg:col-span-5">
              <Reveal>
                <p className="section-eyebrow-dark mb-3">Open Position</p>
                <h2 className="text-3xl lg:text-4xl font-bold text-pine-forest leading-tight mb-4">
                  {ROLE_CONFIG.title}
                </h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="badge-lime">{ROLE_CONFIG.department}</span>
                  <span className="badge bg-pine-border text-pine-slate">{ROLE_CONFIG.location}</span>
                  <span className="badge bg-pine-border text-pine-slate">{ROLE_CONFIG.employmentType}</span>
                </div>
                <p className="text-pine-slate text-sm leading-relaxed mb-8">
                  {ROLE_CONFIG.overview}
                </p>
                {ROLE_CONFIG.isProvisional && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-xs">
                    <Shield size={14} className="mt-0.5 flex-shrink-0" />
                    <span>This is a representative role description for demonstration purposes.</span>
                  </div>
                )}
              </Reveal>

              {/* What you'll work on */}
              <Reveal delay={100} className="mt-10">
                <h3 className="text-base font-bold text-pine-forest mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-pine-lime/30 flex items-center justify-center">
                    <Briefcase size={13} className="text-pine-forest" />
                  </div>
                  What you will do
                </h3>
                <ul className="space-y-2.5">
                  {ROLE_CONFIG.responsibilities.map((r, i) => <CheckItem key={i} text={r} />)}
                </ul>
              </Reveal>
            </div>

            {/* Right: skills + what to submit */}
            <div className="lg:col-span-7 space-y-8">

              <Reveal>
                <div className="card p-7">
                  <h3 className="text-base font-bold text-pine-forest mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-pine-forest/8 flex items-center justify-center">
                      <Zap size={13} className="text-pine-forest" />
                    </div>
                    What we are looking for
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {ROLE_CONFIG.requiredSkills.map((s, i) => <SkillPill key={i} label={s} />)}
                  </div>
                  <p className="text-xs text-pine-slate-light font-semibold uppercase tracking-wider mb-2">
                    Bonus experience
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_CONFIG.preferredSkills.map((s, i) => <SkillPill key={i} label={s} preferred />)}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="card p-7">
                  <h3 className="text-base font-bold text-pine-forest mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-pine-forest/8 flex items-center justify-center">
                      <Archive size={13} className="text-pine-forest" />
                    </div>
                    What to submit
                  </h3>
                  <ul className="space-y-2.5 mb-5">
                    {ROLE_CONFIG.whatToDemo.map((d, i) => <CheckItem key={i} text={d} />)}
                  </ul>
                  <div className="bg-pine-cream rounded-xl p-4 text-xs text-pine-slate leading-relaxed">
                    <span className="font-semibold text-pine-forest block mb-1">How we review</span>
                    {ROLE_CONFIG.whatWeWillLearn}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          VALUES
      ════════════════════════════════════════ */}
      <section id="values" className="section-padding bg-pine-forest-deep relative overflow-hidden">

        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-forest" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-pine-lime/5 to-transparent" />

        <div className="relative z-10 section-container">
          <Reveal className="text-center mb-16">
            <p className="section-eyebrow mb-3">Culture & Values</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white max-w-xl mx-auto">
              What we stand for
            </h2>
            <p className="text-white/50 mt-4 max-w-xl mx-auto text-base">
              Our values are not posters on a wall. They are how we decide what to build,
              how we treat teammates, and what we expect from every person on the team.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPANY_VALUES.map((v, i) => (
              <Reveal key={v.id} delay={i * 80}>
                <div className="group p-6 rounded-3xl border border-white/8 bg-white/4 hover:bg-white/8 hover:border-pine-lime/30 transition-all duration-300 h-full">
                  <div className="w-8 h-8 rounded-xl bg-pine-lime/15 flex items-center justify-center mb-4">
                    <span className="text-pine-lime font-bold text-sm">{(i + 1).toString().padStart(2, '0')}</span>
                  </div>
                  <h3 className="font-bold text-white mb-2 text-base group-hover:text-pine-lime transition-colors">
                    {v.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-3">{v.description}</p>
                  <div className="pt-3 border-t border-white/8">
                    <p className="text-xs text-pine-lime/60 leading-relaxed">{v.engineering}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          APPLICATION PROCESS
      ════════════════════════════════════════ */}
      <section id="process" className="section-padding bg-white">
        <div className="section-container">
          <Reveal className="text-center mb-16">
            <p className="section-eyebrow-dark mb-3">Application Process</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-pine-forest max-w-xl mx-auto">
              How to apply
            </h2>
            <p className="text-pine-slate mt-4 max-w-lg mx-auto text-base">
              The process is straightforward. Fill in your details, upload your resume and a project,
              and our team will review your submission.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {APPLICATION_STEPS.map((step, i) => (
              <Reveal key={step.number} delay={i * 80}>
                <div className="relative">
                  {/* connector line */}
                  {i < APPLICATION_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-[calc(50%+32px)] right-[-50%] h-px bg-pine-border z-0" />
                  )}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-pine-forest text-white font-bold text-lg flex items-center justify-center mb-4 shadow-glow-forest">
                      {step.number}
                    </div>
                    <h3 className="font-bold text-pine-forest mb-2 text-sm">{step.title}</h3>
                    <p className="text-xs text-pine-slate leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Preparation checklist */}
          <Reveal>
            <div className="bg-pine-cream rounded-3xl p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div>
                  <p className="section-eyebrow-dark mb-2">Before you submit</p>
                  <h3 className="text-2xl font-bold text-pine-forest mb-3">Preparation checklist</h3>
                  <p className="text-pine-slate text-sm leading-relaxed">
                    Take a few minutes to review these items before submitting your application.
                    Strong submissions are clear, well-documented, and demonstrate how you think.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: FileText, label: 'Resume is up to date', detail: 'PDF or DOCX, max 10 MB' },
                    { icon: Archive, label: 'Project ZIP is ready', detail: 'Include a README, max 50 MB' },
                    { icon: Users, label: 'GitHub / LinkedIn handy', detail: 'Optional but helpful' },
                    { icon: CheckCircle2, label: 'README explains choices', detail: 'Architecture, trade-offs' },
                  ].map(({ icon: Icon, label, detail }, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-pine-border">
                      <div className="w-8 h-8 rounded-xl bg-pine-lime/20 flex items-center justify-center flex-shrink-0">
                        <Icon size={15} className="text-pine-forest" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-pine-forest leading-tight">{label}</p>
                        <p className="text-xs text-pine-slate mt-0.5">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          APPLY CTA
      ════════════════════════════════════════ */}
      <section id="apply" className="section-padding bg-pine-lime relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pine-forest/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pine-forest/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 section-container text-center">
          <Reveal>
            <p className="text-pine-forest/60 text-xs font-semibold uppercase tracking-widest mb-3">
              Ready to join?
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-pine-forest mb-5 tracking-tight">
              Start your application
            </h2>
            <p className="text-pine-forest/70 text-base max-w-md mx-auto mb-10 leading-relaxed">
              Upload your resume and project. The process takes about 5 minutes.
              We review every submission personally.
            </p>
            <Link
              to="/submit"
              className="btn-primary-dark text-base px-10 py-4 shadow-glow-forest inline-flex items-center gap-2"
            >
              Open Application Form
              <ArrowRight size={18} />
            </Link>
            <p className="text-pine-forest/40 text-xs mt-5">
              No account required · All file types accepted · Secure upload
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="bg-pine-forest-deep text-white/40 py-12">
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <svg width="26" height="26" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="34" height="34" rx="8" fill="#D0F255" />
              <path d="M9 24L17 9L25 24" stroke="#003434" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 18.5H13" stroke="#003434" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="font-semibold text-white/70 text-sm">Pine Labs Talent Intelligence</span>
          </div>
          <div className="text-xs text-center">
            © {new Date().getFullYear()} Pine Labs Pvt. Ltd. · Built for demonstration purposes.
          </div>
          <Link to="/dashboard" className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
            Recruiter Portal →
          </Link>
        </div>
      </footer>
    </div>
  )
}
