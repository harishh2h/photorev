/**
 * Snapshot grid photos for instant photo viewer open (location.state).
 * @param {object[]} photos
 * @returns {object[]}
 */
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
