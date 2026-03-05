import { useState } from 'react'
import AuthIllustration from './AuthIllustration.jsx'
import AuthForm from './AuthForm.jsx'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [mode, setMode] = useState('signIn')

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'))
  }

  return (
    <div className={styles.page}>
      <div className={styles.formColumn}>
        <div className={styles.formInner}>
          <AuthForm mode={mode} onToggleMode={handleToggleMode} />
        </div>
      </div>
      <div className={styles.illustrationColumn}>
        <div className={styles.illustrationInner}>
          <AuthIllustration />
        </div>
      </div>
    </div>
  )
}
