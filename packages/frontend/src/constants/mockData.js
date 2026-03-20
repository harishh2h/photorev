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
