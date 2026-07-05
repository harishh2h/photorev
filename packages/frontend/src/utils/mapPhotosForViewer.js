/**
 * Snapshot grid photos for instant photo viewer open (location.state).
 * @param {object[]} photos
 * @returns {object[]}
 */
/**
 * Keep viewer navigation list from open-time snapshot; patch review fields from fresh grid rows.
 * @param {object[]} navPhotos
 * @param {object[]} gridPhotos
 * @returns {object[]}
 */
export function mergeViewerPhotosFromGrid(navPhotos, gridPhotos) {
  if (!Array.isArray(navPhotos) || navPhotos.length === 0) return []
  if (!Array.isArray(gridPhotos) || gridPhotos.length === 0) return navPhotos
  const byId = new Map(gridPhotos.map((p) => [p.id, p]))
  return navPhotos.map((navPhoto) => {
    const gridPhoto = byId.get(navPhoto.id)
    if (!gridPhoto) return navPhoto
    const [mapped] = mapPhotosForViewer([gridPhoto])
    return { ...navPhoto, ...mapped }
  })
}

export function mapPhotosForViewer(photos) {
  if (!Array.isArray(photos)) return []
  return photos.map((p) => {
    const status = p.status === 'trashed' ? 'ready' : p.status
    return {
      id: p.id,
      alt: p.alt,
      status: status === 'ready' || status === 'failed' || status === 'pending' ? status : 'pending',
      width: p.width ?? null,
      height: p.height ?? null,
      isLiked: Boolean(p.isLiked ?? p.myIsLiked),
      isRejected: Boolean(p.isRejected ?? p.myIsRejected),
      renamedTo: p.renamedTo ?? null,
      selectionLabel: p.selectionLabel ?? null,
    }
  })
}
