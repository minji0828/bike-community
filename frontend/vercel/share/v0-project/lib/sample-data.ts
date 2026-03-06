export interface Course {
  id: string
  name: string
  description: string
  distance: number // km
  estimatedTime: number // minutes
  difficulty: 'easy' | 'medium' | 'hard'
  toiletCount: number
  thumbnail: string
  path: { lat: number; lng: number }[]
  pois: POI[]
}

export interface POI {
  id: string
  type: 'toilet' | 'water' | 'rest' | 'cafe'
  name: string
  lat: number
  lng: number
  distance?: number
}

export interface RideRecord {
  id: string
  date: string
  courseName?: string
  distance: number
  duration: number // seconds
  avgSpeed: number
}

export const sampleCourses: Course[] = [
  {
    id: '1',
    name: '한강 뚝섬 코스',
    description: '뚝섬유원지에서 잠실까지 이어지는 편안한 코스',
    distance: 8.5,
    estimatedTime: 45,
    difficulty: 'easy',
    toiletCount: 4,
    thumbnail: '/course-1.jpg',
    path: [
      { lat: 37.5299, lng: 127.0666 },
      { lat: 37.5285, lng: 127.0750 },
      { lat: 37.5180, lng: 127.0850 },
    ],
    pois: [
      { id: 'p1', type: 'toilet', name: '뚝섬유원지 화장실', lat: 37.5299, lng: 127.0666 },
      { id: 'p2', type: 'cafe', name: '한강 카페', lat: 37.5285, lng: 127.0720 },
      { id: 'p3', type: 'toilet', name: '잠실한강공원 화장실', lat: 37.5180, lng: 127.0850 },
    ],
  },
  {
    id: '2',
    name: '여의도 벚꽃길',
    description: '여의도 윤중로를 따라 달리는 벚꽃 명소 코스',
    distance: 5.2,
    estimatedTime: 30,
    difficulty: 'easy',
    toiletCount: 3,
    thumbnail: '/course-2.jpg',
    path: [
      { lat: 37.5283, lng: 126.9320 },
      { lat: 37.5260, lng: 126.9280 },
      { lat: 37.5220, lng: 126.9350 },
    ],
    pois: [
      { id: 'p4', type: 'toilet', name: '여의도공원 화장실', lat: 37.5283, lng: 126.9320 },
      { id: 'p5', type: 'rest', name: '한강 쉼터', lat: 37.5260, lng: 126.9300 },
    ],
  },
  {
    id: '3',
    name: '반포 달빛 코스',
    description: '반포대교 달빛무지개분수를 감상하며 달리는 야경 코스',
    distance: 6.8,
    estimatedTime: 40,
    difficulty: 'easy',
    toiletCount: 5,
    thumbnail: '/course-3.jpg',
    path: [
      { lat: 37.5130, lng: 126.9950 },
      { lat: 37.5100, lng: 127.0050 },
      { lat: 37.5080, lng: 127.0150 },
    ],
    pois: [
      { id: 'p6', type: 'toilet', name: '반포한강공원 화장실', lat: 37.5130, lng: 126.9950 },
      { id: 'p7', type: 'cafe', name: '세빛섬 카페', lat: 37.5100, lng: 127.0050 },
    ],
  },
]

export const sampleRides: RideRecord[] = [
  {
    id: 'r1',
    date: '2024-03-15',
    courseName: '한강 뚝섬 코스',
    distance: 8.5,
    duration: 2700,
    avgSpeed: 11.3,
  },
  {
    id: 'r2',
    date: '2024-03-10',
    courseName: '여의도 벚꽃길',
    distance: 5.2,
    duration: 1800,
    avgSpeed: 10.4,
  },
  {
    id: 'r3',
    date: '2024-03-05',
    distance: 12.3,
    duration: 4200,
    avgSpeed: 10.5,
  },
]

export const nearbyPOIs: POI[] = [
  { id: 'np1', type: 'toilet', name: '공원 화장실', lat: 37.5665, lng: 126.9780, distance: 120 },
  { id: 'np2', type: 'toilet', name: '편의점 화장실', lat: 37.5680, lng: 126.9800, distance: 350 },
  { id: 'np3', type: 'cafe', name: '자전거 카페', lat: 37.5650, lng: 126.9750, distance: 500 },
]
