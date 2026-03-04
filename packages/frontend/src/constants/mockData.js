/**
 * Mock data for Dashboard. No logic — components read this or receive via props.
 */

export const DASHBOARD_STATS = {
  totalProjects: 12,
  photosProcessed: 2847,
  pendingReviews: 3,
}

export const USER = {
  displayName: 'Alex',
}

export const RESUME_ITEMS = [
  {
    id: '1',
    projectName: 'Summer Wedding',
    albumName: 'Ceremony',
    coverImageUrl: 'https://picsum.photos/seed/1/800/600',
    selectedCount: 24,
    totalCount: 120,
    lastActiveAt: '2 hours ago',
  },
  {
    id: '2',
    projectName: 'Product Launch',
    albumName: 'All photos',
    coverImageUrl: null,
    selectedCount: 0,
    totalCount: 45,
    lastActiveAt: 'Yesterday',
  },
  {
    id: '3',
    projectName: 'Portrait Session',
    albumName: 'Outtakes',
    coverImageUrl: 'https://picsum.photos/seed/3/800/600',
    selectedCount: 12,
    totalCount: 60,
    lastActiveAt: '3 days ago',
  },
  {
    id: '4',
    projectName: 'Street Photography',
    albumName: null,
    coverImageUrl: 'https://picsum.photos/seed/4/800/600',
    selectedCount: 8,
    totalCount: 80,
    lastActiveAt: '1 week ago',
  },
]

export const LIBRARY_PROJECTS = [
  {
    id: '1',
    name: 'Summer Wedding',
    photoCount: 320,
    createdAt: '2025-02-01',
    status: 'In Review',
    coverImageUrls: [
      'https://picsum.photos/seed/a/400/400',
      'https://picsum.photos/seed/b/400/400',
      'https://picsum.photos/seed/c/400/400',
      'https://picsum.photos/seed/d/400/400',
    ],
  },
  {
    id: '2',
    name: 'Product Launch',
    photoCount: 45,
    createdAt: '2025-02-15',
    status: 'Active',
    coverImageUrls: ['https://picsum.photos/seed/e/400/400'],
  },
  {
    id: '3',
    name: 'Portrait Session',
    photoCount: 60,
    createdAt: '2025-01-20',
    status: 'Completed',
    coverImageUrls: [
      'https://picsum.photos/seed/f/400/400',
      'https://picsum.photos/seed/g/400/400',
    ],
  },
  {
    id: '4',
    name: 'Street Photography',
    photoCount: 0,
    createdAt: '2025-03-01',
    status: 'Active',
    coverImageUrls: [],
  },
  {
    id: '5',
    name: 'Event Coverage',
    photoCount: 180,
    createdAt: '2025-01-10',
    status: 'Completed',
    coverImageUrls: [
      'https://picsum.photos/seed/h/400/400',
      'https://picsum.photos/seed/i/400/400',
      'https://picsum.photos/seed/j/400/400',
    ],
  },
  {
    id: '6',
    name: 'Studio Headshots',
    photoCount: 92,
    createdAt: '2025-02-28',
    status: 'In Review',
    coverImageUrls: [
      'https://picsum.photos/seed/k/400/400',
      'https://picsum.photos/seed/l/400/400',
      'https://picsum.photos/seed/m/400/400',
      'https://picsum.photos/seed/n/400/400',
    ],
  },
]
