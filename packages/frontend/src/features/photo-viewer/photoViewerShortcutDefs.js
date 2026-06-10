/** @typedef {{ keys: string[]; label: string; detail?: string }} ShortcutEntry */
/** @typedef {{ id: string; title: string; entries: ShortcutEntry[] }} ShortcutSection */

/** @type {ShortcutSection[]} */
export const PHOTO_VIEWER_SHORTCUT_SECTIONS = [
  {
    id: 'navigation',
    title: 'Navigation',
    entries: [
      { keys: ['←'], label: 'Previous photo' },
      { keys: ['→'], label: 'Next photo' },
      { keys: ['Space'], label: 'Next photo' },
      { keys: ['Esc'], label: 'Back to grid' },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    entries: [
      { keys: ['↑'], label: 'Favorite' },
      { keys: ['↓'], label: 'Reject' },
    ],
  },
  {
    id: 'photo',
    title: 'Photo tools',
    entries: [
      { keys: ['I'], label: 'Toggle info panel' },
      { keys: ['R'], label: 'Open rename' },
      { keys: ['Z'], label: 'Toggle zoom' },
      { keys: ['Scroll'], label: 'Zoom in / out', detail: 'Pinch or Ctrl + scroll' },
    ],
  },
  {
    id: 'rename',
    title: 'Rename field',
    entries: [
      { keys: ['Enter'], label: 'Save rename' },
      { keys: ['Esc'], label: 'Cancel rename' },
    ],
  },
  {
    id: 'grid',
    title: 'Project grid',
    entries: [
      { keys: ['⌘', 'A'], label: 'Select all visible photos', detail: 'Ctrl + A on Windows' },
      { keys: ['Esc'], label: 'Clear selection', detail: 'When photos are selected' },
      { keys: ['Shift', 'Click'], label: 'Select a range', detail: 'Mouse' },
    ],
  },
  {
    id: 'help',
    title: 'Help',
    entries: [
      { keys: ['?', '/'], label: 'Open this shortcuts guide' },
      { keys: ['Esc'], label: 'Close guide' },
    ],
  },
]
