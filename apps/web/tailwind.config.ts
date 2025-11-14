import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      borderRadius: {
        none: '0px',
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      colors: {
        background: 'var(--tenet-background)',
        foreground: 'var(--tenet-foreground)',
        border: 'var(--tenet-border)',
        muted: 'var(--tenet-muted)',
        accent: {
          DEFAULT: 'var(--tenet-accent)',
          foreground: 'var(--tenet-accent-foreground)',
        },
        gray: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#868E96',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },
        success: '#3FB983',
        warning: '#F2A93B',
        error: '#E5484D',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0px 1px 2px rgba(0,0,0,0.04)',
        panel: '0px 2px 4px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [animatePlugin],
}

export default config
