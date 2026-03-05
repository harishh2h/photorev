import styles from './AuthIllustration.module.css'
import illustrationSvg from '@/assets/undraw_photo-session_flr1.svg'

const TAGLINE = 'Make your photo review easier and organized with PhotoRev.'

export default function AuthIllustration() {
  return (
    <div className={styles.wrapper} aria-hidden>
      <img
        src={illustrationSvg}
        alt=""
        className={styles.illustration}
      />
      <p className={styles.tagline}>{TAGLINE}</p>
    </div>
  )
}
