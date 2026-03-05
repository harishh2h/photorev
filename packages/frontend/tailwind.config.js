import { theme } from './src/styles/theme.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: theme.colors.bg,
        surface: theme.colors.surface,
        panel: theme.colors.panel,
        border: theme.colors.border,
        accent: theme.colors.accent,
        text: theme.colors.text,
        muted: theme.colors.textMuted,
        'surface-hover': theme.colors.surfaceHover,
        action: theme.colors.actionBg,
      },
      fontFamily: {
        base: [theme.fonts.base.split(',')[0].replace(/^['"]|['"]$/g, ''), 'sans-serif'],
        mono: [theme.fonts.mono.split(',')[0].replace(/^['"]|['"]$/g, ''), 'monospace'],
      },
      borderRadius: {
        card: theme.radius.lg,
        pill: theme.radius.pill,
        floating: theme.radius.md,
        sm: theme.radius.sm,
        md: theme.radius.md,
        lg: theme.radius.lg,
        xl: theme.radius.xl,
      },
      boxShadow: {
        card: theme.shadows.card,
        'card-hover': theme.shadows.cardHover,
        floating: theme.shadows.floating,
        focus: theme.shadows.focus,
      },
    },
  },
  plugins: [],
}
