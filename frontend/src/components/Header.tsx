import { Link } from 'react-router-dom'

interface HeaderProps {
  showDashboardLink?: boolean
  showSubmitLink?: boolean
}

export default function Header({ showDashboardLink = false, showSubmitLink = false }: HeaderProps) {
  return (
    <header className="bg-white border-b border-pine-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo / Wordmark */}
        <Link to="/" className="flex items-center gap-3 group">
          {/* Pine Labs Arrow Icon */}
          <div className="w-8 h-8 relative flex-shrink-0">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect width="32" height="32" rx="6" fill="#0A1628"/>
              <path d="M8 22L16 8L24 22" stroke="#00C853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 17H12" stroke="#00C853" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="text-pine-navy font-bold text-[15px] leading-none tracking-tight group-hover:text-pine-green transition-colors">
              Pine Labs
            </div>
            <div className="text-pine-slate-light text-[10px] font-medium tracking-wider uppercase leading-none mt-0.5">
              Talent Intelligence
            </div>
          </div>
        </Link>

        {/* Right side links */}
        <nav className="flex items-center gap-1">
          {showSubmitLink && (
            <Link
              to="/"
              className="btn-ghost text-sm"
            >
              Submit Application
            </Link>
          )}
          {showDashboardLink && (
            <Link
              to="/dashboard"
              className="btn-ghost text-sm"
            >
              Hiring Dashboard →
            </Link>
          )}
          <span className="ml-3 text-[10px] font-semibold text-pine-slate-light uppercase tracking-wider 
                           border border-pine-border rounded-full px-2 py-0.5">
            Prototype
          </span>
        </nav>
      </div>
    </header>
  )
}
