/**
 * @param {string} isoDate
 * @returns {string}
 */
export function formatShortDate(isoDate) {
  try {
    const d = new Date(isoDate)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d)
  } catch {
    return ''
  }
}
