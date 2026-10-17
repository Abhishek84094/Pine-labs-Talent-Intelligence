import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard } from 'lucide-react'

interface NavbarProps {
  variant?: 'landing' | 'form' | 'dashboard'
}

// Official Pine Labs SVG logo (wordmark from plcorp-cdn.pinelabs.com)
function PineLabsLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      <svg width="30" height="30" className="sm:w-[34px] sm:h-[34px] flex-shrink-0" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="34" height="34" rx="8" fill={dark ? '#D0F255' : '#003434'} />
        <path d="M9 24L17 9L25 24" stroke={dark ? '#003434' : '#D0F255'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 18.5H13" stroke={dark ? '#003434' : '#D0F255'} strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <div>
        <div className={`font-bold text-sm sm:text-[15px] leading-none tracking-tight ${dark ? 'text-pine-forest' : 'text-white'}`}>
          Pine Labs
        </div>
        <div className={`text-[8px] sm:text-[9px] font-semibold tracking-[0.15em] sm:tracking-[0.18em] uppercase leading-none mt-0.5 ${dark ? 'text-pine-slate' : 'text-white/50'}`}>
          Talent Intelligence
        </div>
      </div>
    </div>
  )
}

export { PineLabsLogo }

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false) }, [location])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (variant === 'form') {
    return (
      <header className="bg-white border-b border-pine-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <PineLabsLogo dark />
          </Link>
          <Link to="/" className="text-xs sm:text-sm text-pine-slate hover:text-pine-forest transition-colors flex items-center gap-1">
            ← <span className="hidden sm:inline">Back to overview</span><span className="sm:hidden">Overview</span>
          </Link>
        </div>
      </header>
    )
  }

  if (variant === 'dashboard') {
    return (
      <header className="bg-white border-b border-pine-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex-shrink-0">
            <PineLabsLogo dark />
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link to="/" className="btn-ghost text-xs sm:text-sm py-1.5 px-2.5 sm:px-3">
              <span className="hidden sm:inline">Submit Application</span>
              <span className="sm:hidden">+ Apply</span>
            </Link>
            <span className="text-[8px] sm:text-[9px] font-bold text-pine-slate uppercase tracking-wider sm:tracking-widest border border-pine-border rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1">
              Recruiter
            </span>
          </nav>
        </div>
      </header>
    )
  }

  // Landing variant
  const navBg = scrolled
    ? 'bg-pine-forest-deep/95 nav-sticky shadow-glow-forest'
    : 'bg-transparent'

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <PineLabsLogo dark={false} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <button onClick={() => scrollTo('about')} className="nav-link px-3 py-2 text-white/70 hover:text-white text-sm font-medium transition-colors">
              About Pine Labs
            </button>
            <button onClick={() => scrollTo('role')} className="nav-link px-3 py-2 text-white/70 hover:text-white text-sm font-medium transition-colors">
              The Role
            </button>
            <button onClick={() => scrollTo('values')} className="nav-link px-3 py-2 text-white/70 hover:text-white text-sm font-medium transition-colors">
              What We Value
            </button>
            <button onClick={() => scrollTo('process')} className="nav-link px-3 py-2 text-white/70 hover:text-white text-sm font-medium transition-colors">
              How to Apply
            </button>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/dashboard" className="text-white/50 hover:text-white/80 transition-colors flex items-center gap-1.5 text-xs font-medium">
              <LayoutDashboard size={13} />
              Hiring Dashboard
            </Link>
            <button onClick={() => scrollTo('apply')} className="btn-primary text-sm px-5 py-2.5">
              Apply Now
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
        <div className={`absolute top-0 right-0 bottom-0 w-72 bg-pine-forest-deep flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
            <PineLabsLogo dark={false} />
            <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 p-6 space-y-1">
            {[
              { label: 'About Pine Labs', id: 'about' },
              { label: 'The Role', id: 'role' },
              { label: 'What We Value', id: 'values' },
              { label: 'How to Apply', id: 'process' },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded-xl text-sm font-medium transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-white/10 space-y-3">
            <button onClick={() => scrollTo('apply')} className="btn-primary w-full justify-center">
              Apply Now
            </button>
            <Link to="/dashboard" className="btn-outline-white w-full justify-center text-sm" onClick={() => setMobileOpen(false)}>
              <LayoutDashboard size={14} /> Hiring Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
