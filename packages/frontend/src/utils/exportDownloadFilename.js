/**
 * Filename for downloads: rename label when set, otherwise original upload name.
 *
 * @param {{ originalName?: string | null; renamedTo?: string | null }} photo
 * @returns {string | null}
 */
export function exportDownloadFilename({ originalName, renamedTo }) {
  const renamed = typeof renamedTo === 'string' ? renamedTo.trim() : ''
  if (renamed) {
    if (!/\.\w{1,12}$/i.test(renamed) && typeof originalName === 'string') {
      const ext = originalName.match(/(\.[^./\\]+)$/)?.[1]
      if (ext) return `${renamed}${ext}`
    }
    return renamed
  }
  const original = typeof originalName === 'string' ? originalName.trim() : ''
  return original.length > 0 ? original : null
}
