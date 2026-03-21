export const DASHBOARD_OVERVIEW = {
  activeSessionCount: 3,
  pendingReviews: 2,
  featuredProject: {
    name: 'The Sterling Wedding',
    description: 'High-contrast editorial style. Session held at The Manor Estate.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    totalPhotos: 482,
    flaggedPhotos: 12,
  },
  recentActivity: [
    {
      id: 'a1',
      actorInitial: 'A',
      message: 'Ananya liked DSC_042.ARW',
      timeLabel: '3 MINS AGO',
      dotColor: '#66f0c8',
    },
    {
      id: 'a2',
      actorInitial: 'R',
      message: 'Ravi rejected IMG_8821.JPG',
      timeLabel: '5 MINS AGO',
      dotColor: '#9ee9d1',
    },
    {
      id: 'a3',
      actorInitial: 'K',
      message: "Karthik renamed to 'Summer Sunset'",
      timeLabel: '8 MINS AGO',
      dotColor: '#f4c150',
    },
    {
      id: 'a4',
      actorInitial: 'C',
      message: 'Client approved Coastal Retreat',
      timeLabel: '2 HOURS AGO',
      dotColor: '#b983ff',
    },
  ],
}

export const LIBRARY_PROJECTS = [
  {
    id: '1',
    name: 'Urban Noir',
    status: 'DRAFT',
    subtitle: 'ACTIVE 2H AGO',
    coverImageUrl:
      'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    name: 'Sterling Wedding',
    status: 'ACTIVE',
    subtitle: 'ANANYA IS REVIEWING NOW',
    coverImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    name: 'Autumn Lookbook',
    status: 'COMPLETE',
    subtitle: 'LAST ACTIVE YESTERDAY',
    coverImageUrl:
      'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '4',
    name: 'Coastal Retreat',
    status: 'REVIEW',
    subtitle: 'RAVI IS REVIEWING NOW',
    coverImageUrl:
      'https://images.unsplash.com/photo-1491472253230-a044054ca35f?auto=format&fit=crop&w=800&q=80',
  },
]

/** @typedef {{ id: string; src: string; alt: string; isLiked: boolean; isRejected: boolean; hasConflict: boolean; selectionLabel: string | null }} ProjectViewPhoto */

/** @typedef {{ id: string; name: string; initial: string }} ProjectViewCollaboratorMember */

/** @type {{ projectTitle: string; collaboratingLabel: string; likedCount: number; likedWithNames: string; reviewProgressPercent: number; collaboratorMembers: ProjectViewCollaboratorMember[]; filterCounts: { all: number; liked: number; rejected: number; conflicts: number }; photos: ProjectViewPhoto[] }} */
const PROJECT_VIEW_DEFAULT = {
  projectTitle: "Urban Editorial '24",
  collaboratingLabel: 'REVIEWING WITH 3 OTHERS',
  likedCount: 12,
  likedWithNames: 'Ananya and Ravi',
  reviewProgressPercent: 15,
  collaboratorMembers: [
    { id: 'm1', name: 'Ananya Rao', initial: 'A' },
    { id: 'm2', name: 'Ravi Kumar', initial: 'R' },
    { id: 'm3', name: 'Karthik Sundar', initial: 'K' },
    { id: 'm4', name: 'Maya Chen', initial: 'M' },
    { id: 'm5', name: 'Jordan Ellis', initial: 'J' },
    { id: 'm6', name: 'Priya Nair', initial: 'P' },
    { id: 'm7', name: 'Sam Okafor', initial: 'S' },
    { id: 'm8', name: 'Elena Rossi', initial: 'E' },
    { id: 'm9', name: 'Noah Kim', initial: 'N' },
    { id: 'm10', name: 'Zara Ahmed', initial: 'Z' },
    { id: 'm11', name: 'Lucas Meyer', initial: 'L' },
    { id: 'm12', name: 'Hannah Cho', initial: 'H' },
    { id: 'm13', name: 'Diego Alvarez', initial: 'D' },
    { id: 'm14', name: 'Freya Lindström', initial: 'F' },
  ],
  filterCounts: { all: 80, liked: 12, rejected: 4, conflicts: 2 },
  photos: [
    {
      id: 'pv1',
      src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      alt: 'Editorial portrait one',
      isLiked: true,
      isRejected: false,
      hasConflict: false,
      selectionLabel: 'Selected for Cover',
    },
    {
      id: 'pv2',
      src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80',
      alt: 'Editorial portrait two',
      isLiked: false,
      isRejected: false,
      hasConflict: false,
      selectionLabel: null,
    },
    {
      id: 'pv3',
      src: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=600&q=80',
      alt: 'Editorial portrait three',
      isLiked: true,
      isRejected: true,
      hasConflict: true,
      selectionLabel: null,
    },
    {
      id: 'pv4',
      src: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80',
      alt: 'Editorial portrait four',
      isLiked: true,
      isRejected: false,
      hasConflict: false,
      selectionLabel: null,
    },
    {
      id: 'pv5',
      src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      alt: 'Editorial portrait five',
      isLiked: false,
      isRejected: true,
      hasConflict: false,
      selectionLabel: null,
    },
    {
      id: 'pv6',
      src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
      alt: 'Editorial portrait six',
      isLiked: false,
      isRejected: false,
      hasConflict: false,
      selectionLabel: null,
    },
    {
      id: 'pv7',
      src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
      alt: 'Editorial portrait seven',
      isLiked: true,
      isRejected: false,
      hasConflict: false,
      selectionLabel: null,
    },
    {
      id: 'pv8',
      src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      alt: 'Editorial portrait eight',
      isLiked: false,
      isRejected: false,
      hasConflict: true,
      selectionLabel: null,
    },
    {
      id: 'pv9',
      src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80',
      alt: 'Editorial portrait nine',
      isLiked: true,
      isRejected: false,
      hasConflict: false,
      selectionLabel: null,
    },
  ],
}

/**
 * @param {string} [projectId]
 * @returns {typeof PROJECT_VIEW_DEFAULT}
 */
export function getProjectViewData(projectId) {
  void projectId
  return PROJECT_VIEW_DEFAULT
}
