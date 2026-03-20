import { useState } from 'react'
import AuthForm from './AuthForm.jsx'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [mode, setMode] = useState('signUp')
  const handleToggleMode = () => setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'))

  return (
    <div className={styles.page} data-mode={mode}>
      <div className={styles.gridTexture} aria-hidden />
      <div className={styles.floatingLayer} aria-hidden>
        <div className={`${styles.floatingCard} ${styles.topLeftLarge}`} />
        <div className={`${styles.floatingCard} ${styles.topLeftSmall}`}>
          <span className={styles.note}>Keep these -&gt;</span>
        </div>
        <div className={`${styles.floatingCard} ${styles.topRight}`} />
        <div className={`${styles.floatingCard} ${styles.bottomLeft}`} />
        <div className={`${styles.floatingCard} ${styles.bottomRightTop}`} />
        <div className={`${styles.floatingCard} ${styles.bottomRightBottom}`} />
      </div>
      <div className={styles.formShell}>
        <div className={styles.formInner}>
          <AuthForm mode={mode} onToggleMode={handleToggleMode} />
        </div>
        <p className={styles.trustLine}>
          Trusted by photographers at Vogue, Nike, and Conde Nast.
        </p>
      </div>
    </div>
  )
}
