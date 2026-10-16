/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Pine Labs brand colors (from pinelabs.com)
        pine: {
          // Primary dark forest green (from official site)
          forest:      '#003434',
          'forest-deep': '#00262C',
          'forest-mid':  '#054040',
          // Lime / alt-bg accent (from official CTA buttons)
          lime:        '#D0F255',
          'lime-hover': '#b5d445',
          'lime-light': '#f4fcd5',
          // Mint green (from stats and accents)
          mint:        '#13BBCA',
          'mint-light': '#e0f9fb',
          // Legacy green aliases (keep for existing components)
          green:       '#00C853',
          'green-dark': '#00A844',
          'green-light': '#E8F9F0',
          // Navy (deep backgrounds)
          navy:        '#0A1628',
          'navy-light': '#1A2B44',
          'navy-mid':  '#2D3F5C',
          // Neutrals
          slate:       '#4A5568',
          'slate-light': '#718096',
          cream:       '#F7F8FA',
          white:       '#FFFFFF',
          border:      '#E2E8F0',
          'border-dark': '#CBD5E0',
        },
        status: {
          success: '#00C853',
          warning: '#F59E0B',
          error:   '#EF4444',
          info:    '#3B82F6',
          pending: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['4rem', { lineHeight: '1.04', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['3rem', { lineHeight: '1.08', letterSpacing: '-0.02em', fontWeight: '600' }],
        'hero': ['3.5rem', { lineHeight: '1.06', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      boxShadow: {
        'card':      '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.04)',
        'card-hover':'0 8px 24px -4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.06)',
        'elevated':  '0 10px 40px -8px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)',
        'lime':      '0 0 0 3px rgba(208,242,85,0.35)',
        'glow-green':'0 0 0 3px rgba(0,200,83,0.2)',
        'glow-forest':'0 8px 32px rgba(0,52,52,0.25)',
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-out',
        'fade-up':     'fadeUp 0.5s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'slide-down':  'slideDown 0.3s ease-out',
        'pulse-lime':  'pulseLime 2s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'draw-line':   'drawLine 1.2s ease-out forwards',
        'counter-tick':'counterTick 0.6s ease-out',
        'shimmer':     'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseLime: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(208,242,85,0.4)' },
          '50%':      { boxShadow: '0 0 0 10px rgba(208,242,85,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        drawLine: {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      backgroundImage: {
        'grid-forest': 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'gradient-lime': 'linear-gradient(135deg, #D0F255 0%, #b5d445 100%)',
        'gradient-forest': 'linear-gradient(135deg, #003434 0%, #054040 100%)',
        'gradient-hero': 'linear-gradient(180deg, #00262C 0%, #003434 60%, #054040 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
