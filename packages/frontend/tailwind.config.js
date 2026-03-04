import { theme } from './src/styles/theme.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: theme.colors.bg,
        surface: theme.colors.surface,
        border: theme.colors.border,
        accent: theme.colors.accent,
        text: theme.colors.text,
        muted: theme.colors.textMuted,
        'surface-hover': theme.colors.surfaceHover,
      },
      borderRadius: {
        card: theme.radius.lg,
        pill: theme.radius.full,
        sm: theme.radius.sm,
        md: theme.radius.md,
        lg: theme.radius.lg,
      },
      fontFamily: {
        display: [theme.fonts.display.split(',')[0].replace(/^['"]|['"]$/g, ''), 'sans-serif'],
        body: [theme.fonts.body.split(',')[0].replace(/^['"]|['"]$/g, ''), 'sans-serif'],
        mono: [theme.fonts.mono.split(',')[0].replace(/^['"]|['"]$/g, ''), 'monospace'],
      },
      boxShadow: {
        card: theme.shadows.sm,
        'card-hover': theme.shadows.md,
        focus: theme.shadows.focus,
      },
    },
  },
  plugins: [],
}
