import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { getPhoto } from '@/services/photoService.js'
import { listAllPhotoReviewsForPhoto } from '@/services/photoReviewService.js'
import { formatExifDate } from '@/features/photo-viewer/formatExifDate.js'

const TAB_EXIF = 'exif'
const TAB_ACTIVITY = 'activity'

function MetaRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/[0.08] py-3 last:border-b-0">
      <span className="font-base text-xs font-medium text-white/45">{label}</span>
      <span className="break-all font-mono text-sm text-white/88">{String(value)}</span>
    </div>
  )
}

MetaRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

/**
 * @param {{ open: boolean; photoId: string; token: string; memberNameByUserId: Map<string, string>; canReviewPhotos?: boolean; onClose: () => void }} props
 */
export default function PhotoViewerInfoPanel({
  open,
  photoId,
  token,
  memberNameByUserId,
  canReviewPhotos = true,
  onClose,
}) {
  const [panelTab, setPanelTab] = useState(TAB_EXIF)
  const [photoDetail, setPhotoDetail] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loadErr, setLoadErr] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setPanelTab(TAB_EXIF)
  }, [open, photoId])

  useEffect(() => {
    if (!canReviewPhotos && panelTab === TAB_ACTIVITY) {
      setPanelTab(TAB_EXIF)
    }
  }, [canReviewPhotos, panelTab])

  useEffect(() => {
    if (!open || !photoId || !token) return undefined
    let cancelled = false
    setLoadErr(null)
    setLoading(true)
    const run = async () => {
      try {
        const detail = await getPhoto(token, photoId)
        if (!canReviewPhotos) {
          if (!cancelled) {
            setPhotoDetail(detail)
            setReviews([])
          }
          return
        }
        const [detailResolved, revs] = await Promise.all([
          Promise.resolve(detail),
          listAllPhotoReviewsForPhoto(token, photoId),
        ])
        if (!cancelled) {
          setPhotoDetail(detailResolved)
          setReviews(revs)
        }
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open, photoId, token, canReviewPhotos])

  if (!open) return null

  const meta = photoDetail?.metadata && typeof photoDetail.metadata === 'object' ? photoDetail.metadata : {}
  const format = meta.format ?? null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[380] cursor-default bg-black/40 transition-opacity duration-200"
        aria-label="Close details"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 right-0 top-0 z-[390] flex w-[min(420px,88vw)] min-h-0 flex-col border-l border-white/[0.12] bg-[#0a0a0a] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-viewer-details-title"
      >
        <div className="border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="photo-viewer-details-title" className="m-0 font-base text-lg font-semibold text-white">
              Details
            </h2>
            <button
              type="button"
              className="flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border-[1.5px] border-white/20 bg-transparent font-base text-sm text-white/70 transition-colors duration-150 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          {canReviewPhotos ? (
            <div className="mt-4 flex gap-2" role="tablist" aria-label="Detail sections">
              <button
                type="button"
                role="tab"
                aria-selected={panelTab === TAB_EXIF}
                className={`rounded-pill border-[1.5px] px-4 py-2 font-base text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  panelTab === TAB_EXIF
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-white/20 text-white/55 hover:text-white/80'
                }`}
                onClick={() => setPanelTab(TAB_EXIF)}
              >
                File & meta
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={panelTab === TAB_ACTIVITY}
                className={`rounded-pill border-[1.5px] px-4 py-2 font-base text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  panelTab === TAB_ACTIVITY
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-white/20 text-white/55 hover:text-white/80'
                }`}
                onClick={() => setPanelTab(TAB_ACTIVITY)}
              >
                Activity
              </button>
            </div>
          ) : null}
        </div>
        {loading ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <span className="loading loading-spinner loading-md text-accent" aria-label="Loading" />
          </div>
        ) : loadErr ? (
          <p className="m-0 p-5 font-base text-sm text-error">{loadErr}</p>
        ) : panelTab === TAB_EXIF ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-2">
            <MetaRow label="File name" value={photoDetail?.originalName} />
            <MetaRow label="Dimensions" value={formatDimensions(photoDetail?.width, photoDetail?.height)} />
            <MetaRow label="File size" value={formatBytes(photoDetail?.fileSize)} />
            <MetaRow label="MIME type" value={photoDetail?.mimeType} />
            <MetaRow label="Created" value={formatExifDate(photoDetail?.createdAt)} />
            <MetaRow label="Format" value={format} />
            <MetaRow label="Color space" value={meta.space} />
            <MetaRow label="Orientation" value={meta.orientation} />
            <MetaRow label="Density (DPI)" value={formatDensity(meta.density)} />
            <MetaRow label="Channels" value={meta.channels} />
            <MetaRow label="Has alpha" value={meta.hasAlpha != null ? String(meta.hasAlpha) : null} />
          </div>
        ) : (
          <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0 px-5 pb-8 pt-2">
            {reviews.length === 0 ? (
              <li className="font-base text-sm text-white/50">No activity on this photo yet.</li>
            ) : (
              reviews.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-white/[0.06] py-4 font-base text-sm text-white/80 last:border-b-0"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold text-white/95">
                      {memberNameByUserId.get(r.userId) ?? `Member ${shortId(r.userId)}`}
                    </span>
                    <time className="text-xs text-white/40" dateTime={r.votedAt ?? r.seenAt}>
                      {r.votedAt ? formatExifDate(r.votedAt) : formatExifDate(r.seenAt)}
                    </time>
                  </div>
                  <p className="m-0 mt-1 text-white/70">{describeReview(r)}</p>
                </li>
              ))
            )}
          </ul>
        )}
      </aside>
    </>
  )
}

function formatDimensions(w, h) {
  if (typeof w !== 'number' || typeof h !== 'number') return null
  return `${w} × ${h} px`
}

function formatBytes(n) {
  if (typeof n !== 'number' || n < 0) return null
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDensity(d) {
  if (d == null) return null
  if (typeof d === 'number') return String(d)
  if (typeof d === 'object' && d !== null && 'x' in d) {
    const o = /** @type {{ x?: number; y?: number }} */ (d)
    if (typeof o.x === 'number' && typeof o.y === 'number') return `${o.x} × ${o.y}`
  }
  return JSON.stringify(d)
}

function shortId(id) {
  if (typeof id !== 'string' || id.length < 9) return id
  return `…${id.slice(-8)}`
}

function describeReview(r) {
  const parts = []
  if (r.renamedTo) parts.push(`Rename suggestion: "${r.renamedTo}"`)
  if (r.decision === 1) parts.push('Marked as favorite')
  else if (r.decision === -1) parts.push('Rejected')
  else if (!r.renamedTo) parts.push('Viewed')
  return parts.join(' · ')
}

PhotoViewerInfoPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  photoId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  memberNameByUserId: PropTypes.instanceOf(Map).isRequired,
  canReviewPhotos: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
}
