import daisyui from 'daisyui'
import { theme } from './src/styles/theme.js'

/**
 * Pill & Sage → DaisyUI `photorev` theme.
 * primary = black CTA only; accent = emerald (#10B981).
 */
const photorevTheme = {
  'color-scheme': 'light',
  primary: theme.colors.actionBg,
  'primary-content': theme.colors.actionText,
  secondary: theme.colors.textMuted,
  'secondary-content': theme.colors.text,
  accent: theme.colors.accent,
  'accent-content': '#ffffff',
  neutral: theme.colors.border,
  'neutral-content': theme.colors.text,
  'base-100': theme.colors.bg,
  'base-200': theme.colors.panel,
  'base-300': theme.colors.border,
  'base-content': theme.colors.text,
  info: theme.colors.accent,
  success: theme.colors.success,
  warning: theme.colors.warning,
  error: theme.colors.danger,
  '--rounded-box': theme.radius.lg,
  '--rounded-btn': theme.radius.pill,
  '--rounded-badge': theme.radius.pill,
  '--tab-radius': theme.radius.md,
  '--btn-text-case': 'none',
}

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
        'accent-mid': theme.colors.accentMid,
        text: theme.colors.text,
        muted: theme.colors.textMuted,
        'surface-hover': theme.colors.surfaceHover,
        action: theme.colors.actionBg,
        warning: theme.colors.warning,
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
        modal: theme.shadows.modal,
      },
      zIndex: {
        raised: theme.zIndex.raised,
        toast: theme.zIndex.toast,
        modal: theme.zIndex.modal,
        dropdown: theme.zIndex.dropdown,
        sticky: theme.zIndex.sticky,
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [{ photorev: photorevTheme }],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
}
