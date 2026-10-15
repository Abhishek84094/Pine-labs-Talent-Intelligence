/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pine Labs brand colors
        pine: {
          green: '#00C853',
          'green-dark': '#00A844',
          'green-light': '#E8F9F0',
          navy: '#0A1628',
          'navy-light': '#1A2B44',
          'navy-mid': '#2D3F5C',
          slate: '#4A5568',
          'slate-light': '#718096',
          cream: '#F7F8FA',
          white: '#FFFFFF',
          border: '#E2E8F0',
          'border-dark': '#CBD5E0',
        },
        status: {
          success: '#00C853',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
          pending: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow-green': '0 0 0 3px rgba(0, 200, 83, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 200, 83, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 200, 83, 0)' },
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
