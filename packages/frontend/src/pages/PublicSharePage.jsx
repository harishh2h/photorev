import { useParams } from 'react-router-dom'
import { PublicShareScreen } from '@/features/public-share/index.js'

export default function PublicSharePage() {
  const { token } = useParams()
  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4 font-base text-sm text-muted">
        Missing share token.
      </div>
    )
  }
  return <PublicShareScreen token={token} />
}
