import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { injectTheme } from '@/styles/GlobalStyles.js'
import '@/styles/global.css'
import App from './App.jsx'

injectTheme()

if (import.meta.env.DEV) {
  const accent = getComputedStyle(document.documentElement).getPropertyValue(
    '--color-accent'
  )
  // Simple verification log for theme injection
  console.log('[Theme]', '--color-accent =', accent.trim())
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
