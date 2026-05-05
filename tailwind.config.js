/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core brand colors from design spec
        primary: {
          50:  '#E3EAF0',
          100: '#BAC8D5',
          200: '#8DA4B8',
          300: '#60809B',
          400: '#3D6485',
          500: '#1A4A6F', // mid navy
          600: '#153D5E',
          700: '#0F2F4D',
          800: '#0A2038', // deep navy core (gradient center)
          900: '#051525',
          950: '#020617',
        },
        // Layout colors
        sidebar: '#1E1A2E',
        chatbg: '#F7F8FC',
        
        // Muted gray
        muted: '#8887A0',

        // Surface/background scale (dark-first)
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Accent (for online status, CTAs)
        accent: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        // Danger
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(74, 59, 255, 0.35)',
        'glow-accent':  '0 0 20px rgba(16, 185, 129, 0.35)',
        'glow-amber':   '0 0 20px rgba(245, 158, 11, 0.35)',
        'glow-red':     '0 0 20px rgba(239, 68, 68, 0.35)',
        'glass':        '0 8px 32px rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
