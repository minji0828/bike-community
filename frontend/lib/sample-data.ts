export interface Course {
  id: string
  name: string
  description: string
  distance: number
  estimatedTime: number
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
  duration: number
  avgSpeed: number
}

export const sampleCourses: Course[] = [
  {
    id: '1',
    name: '동부5고개 챌린지',
    description: '실제 GPX를 기반으로 한 동부권 대표 업힐 코스. 장거리 라이딩과 여행형 탐방에 어울려요.',
    distance: 68.9,
    estimatedTime: 285,
    difficulty: 'hard',
    toiletCount: 6,
    thumbnail: '/course-1.jpg',
    path: [
      { lat: 37.545265, lng: 127.329109 },
      { lat: 37.557617, lng: 127.371173 },
      { lat: 37.566431, lng: 127.388428 },
      { lat: 37.585190, lng: 127.395804 },
      { lat: 37.578518, lng: 127.417534 },
      { lat: 37.585012, lng: 127.427979 },
      { lat: 37.599168, lng: 127.428439 },
      { lat: 37.610513, lng: 127.420494 },
      { lat: 37.611230, lng: 127.427162 },
      { lat: 37.614757, lng: 127.432666 },
      { lat: 37.637074, lng: 127.437406 },
      { lat: 37.648830, lng: 127.425983 },
      { lat: 37.650456, lng: 127.436813 },
      { lat: 37.658940, lng: 127.443988 },
      { lat: 37.651522, lng: 127.464725 },
      { lat: 37.635901, lng: 127.481559 },
      { lat: 37.616646, lng: 127.491099 },
      { lat: 37.600317, lng: 127.491833 },
      { lat: 37.594652, lng: 127.485542 },
      { lat: 37.602088, lng: 127.487553 },
      { lat: 37.594880, lng: 127.481827 },
      { lat: 37.591685, lng: 127.475796 },
      { lat: 37.580033, lng: 127.458516 },
      { lat: 37.543107, lng: 127.463013 },
      { lat: 37.518601, lng: 127.455755 },
      { lat: 37.514629, lng: 127.436082 },
      { lat: 37.516246, lng: 127.401567 },
      { lat: 37.516507, lng: 127.379151 },
      { lat: 37.532614, lng: 127.364586 },
      { lat: 37.545654, lng: 127.328888 },
    ],
    pois: [
      { id: 'p1', type: 'toilet', name: '팔당대교 인증센터 화장실', lat: 37.545265, lng: 127.329109 },
      { id: 'p2', type: 'water', name: '서후고개 보급 포인트', lat: 37.585012, lng: 127.427979 },
      { id: 'p3', type: 'rest', name: '은고개 쉼터', lat: 37.637074, lng: 127.437406 },
      { id: 'p4', type: 'toilet', name: '남한산성 인근 화장실', lat: 37.580033, lng: 127.458516 },
    ],
  },
  {
    id: '2',
    name: '북한강 주말 여행 코스',
    description: '강변 풍경과 카페 포인트를 묶은 여행형 라이딩. 무리 없이 길게 타기 좋은 중거리 코스예요.',
    distance: 31.8,
    estimatedTime: 140,
    difficulty: 'medium',
    toiletCount: 5,
    thumbnail: '/course-2.jpg',
    path: [
      { lat: 37.592200, lng: 127.355800 },
      { lat: 37.597300, lng: 127.364300 },
      { lat: 37.603900, lng: 127.372600 },
      { lat: 37.610800, lng: 127.383400 },
      { lat: 37.620100, lng: 127.395700 },
      { lat: 37.629700, lng: 127.405800 },
      { lat: 37.639500, lng: 127.418300 },
      { lat: 37.648400, lng: 127.430700 },
      { lat: 37.656000, lng: 127.446400 },
      { lat: 37.661900, lng: 127.463800 },
    ],
    pois: [
      { id: 'p5', type: 'toilet', name: '북한강 자전거길 화장실', lat: 37.603900, lng: 127.372600 },
      { id: 'p6', type: 'cafe', name: '강변 라이더 카페', lat: 37.629700, lng: 127.405800 },
      { id: 'p7', type: 'rest', name: '전망 쉼터', lat: 37.648400, lng: 127.430700 },
    ],
  },
  {
    id: '3',
    name: '한강 석양 시티 투어',
    description: '여행처럼 즐기는 서울 도심 라이딩. 한강과 다리 야경 포인트를 자연스럽게 잇는 코스예요.',
    distance: 19.7,
    estimatedTime: 95,
    difficulty: 'easy',
    toiletCount: 7,
    thumbnail: '/course-3.jpg',
    path: [
      { lat: 37.518900, lng: 126.988500 },
      { lat: 37.521700, lng: 126.999100 },
      { lat: 37.524900, lng: 127.011700 },
      { lat: 37.528700, lng: 127.023800 },
      { lat: 37.530100, lng: 127.039300 },
      { lat: 37.530300, lng: 127.056100 },
      { lat: 37.528700, lng: 127.070200 },
      { lat: 37.524400, lng: 127.082700 },
    ],
    pois: [
      { id: 'p8', type: 'toilet', name: '반포한강공원 화장실', lat: 37.518900, lng: 126.988500 },
      { id: 'p9', type: 'cafe', name: '세빛섬 카페', lat: 37.521700, lng: 126.999100 },
      { id: 'p10', type: 'rest', name: '잠실대교 쉼터', lat: 37.530300, lng: 127.056100 },
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
  { id: 'np1', type: 'toilet', name: '공원 화장실', lat: 37.5665, lng: 126.978, distance: 120 },
  { id: 'np2', type: 'toilet', name: '편의점 화장실', lat: 37.568, lng: 126.98, distance: 350 },
  { id: 'np3', type: 'cafe', name: '자전거 카페', lat: 37.565, lng: 126.975, distance: 500 },
]
