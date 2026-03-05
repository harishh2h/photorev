import { theme } from './theme.js'

const kebab = (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase()

/**
 * Injects theme tokens as CSS custom properties on document.documentElement.
 * Call once at app root (e.g. in main.jsx).
 */
export function injectTheme() {
  const root = document.documentElement
  const { colors, fonts, fontSizes, lineHeights, radius, shadows, motion, spacing, zIndex } = theme

  Object.entries(colors).forEach(([key, val]) => {
    root.style.setProperty(`--color-${kebab(key)}`, val)
  })
  root.style.setProperty('--font-base', fonts.base)
  root.style.setProperty('--font-mono', fonts.mono)
  root.style.setProperty('--border-width', theme.borderWidth)
  Object.entries(fontSizes).forEach(([key, val]) => {
    root.style.setProperty(`--text-${key}`, val)
  })
  Object.entries(lineHeights).forEach(([key, val]) => {
    root.style.setProperty(`--line-height-${kebab(key)}`, String(val))
  })
  Object.entries(radius).forEach(([key, val]) => {
    root.style.setProperty(`--radius-${key}`, val)
  })
  Object.entries(shadows).forEach(([key, val]) => {
    root.style.setProperty(`--shadow-${kebab(key)}`, val)
  })
  root.style.setProperty('--duration-fast', motion.fast)
  root.style.setProperty('--duration-base', motion.base)
  root.style.setProperty('--duration-slow', motion.slow)
  root.style.setProperty('--ease-out', motion.easeOut)
  root.style.setProperty('--ease', motion.ease)
  root.style.setProperty('--card-hover-y', motion.cardHoverY)
  root.style.setProperty('--image-scale', motion.imageHoverScale)
  root.style.setProperty('--stagger-delay', motion.staggerDelay)
  root.style.setProperty('--stagger-duration', motion.staggerDuration)
  root.style.setProperty('--progress-duration', motion.progressDuration)
  Object.entries(spacing).forEach(([key, val]) => {
    root.style.setProperty(`--space-${key}`, val)
  })
  Object.entries(zIndex).forEach(([key, val]) => {
    root.style.setProperty(`--z-index-${kebab(key)}`, String(val))
  })
  root.style.setProperty('--bento-gap', theme.bento.gap)
}
