import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-subtle)',
        elevated: 'var(--bg-elevated)',
        hairline: 'var(--border-hairline)',
        strong: 'var(--border-strong)',
        primary: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          foreground: 'var(--accent-foreground)',
        },
        success: {
          DEFAULT: 'var(--status-success)',
          soft: 'var(--status-success-soft)',
        },
        warning: {
          DEFAULT: 'var(--status-warning)',
          soft: 'var(--status-warning-soft)',
        },
        danger: {
          DEFAULT: 'var(--status-error)',
          soft: 'var(--status-error-soft)',
        },
        info: {
          DEFAULT: 'var(--status-info)',
          soft: 'var(--status-info-soft)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      maxWidth: {
        prose: '720px',
        viz: '1120px',
      },
      transitionTimingFunction: {
        neural: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [typography, animate],
};

export default config;

