import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        board: {
          bg: '#070b14',
          panel: '#0f1623',
          elevated: '#151d2e',
          border: '#243044',
          accent: '#38bdf8',
          'accent-strong': '#0ea5e9',
          warn: '#fbbf24',
          danger: '#fb7185',
          ok: '#34d399',
          muted: '#94a3b8',
        },
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(36, 48, 68, 0.8), 0 18px 40px -24px rgba(0, 0, 0, 0.75)',
        glow: '0 0 24px -6px rgba(56, 189, 248, 0.35)',
        'glow-ok': '0 0 20px -6px rgba(52, 211, 153, 0.35)',
        'glow-danger': '0 0 20px -6px rgba(251, 113, 133, 0.35)',
      },
      backgroundImage: {
        'board-radial':
          'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(56, 189, 248, 0.12), transparent), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(52, 211, 153, 0.06), transparent)',
        'board-grid':
          'linear-gradient(rgba(36, 48, 68, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(36, 48, 68, 0.35) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        panel: '0.875rem',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-up': 'slide-up 220ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
