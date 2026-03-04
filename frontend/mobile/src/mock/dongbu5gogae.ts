import type { CourseDetail, CourseSummary } from '../types/bikeoasis';

export const DONG_BU_5_GOGAE_ID = 900001;

const path = [
  { lat: 37.545265, lon: 127.329109 },
  { lat: 37.557617, lon: 127.371173 },
  { lat: 37.566431, lon: 127.388428 },
  { lat: 37.5852, lon: 127.395758 },
  { lat: 37.578524, lon: 127.417479 },
  { lat: 37.585001, lon: 127.427979 },
  { lat: 37.599157, lon: 127.428421 },
  { lat: 37.6105, lon: 127.420478 },
  { lat: 37.61121, lon: 127.427147 },
  { lat: 37.6146, lon: 127.432479 },
  { lat: 37.637116, lon: 127.437539 },
  { lat: 37.648813, lon: 127.425949 },
  { lat: 37.650471, lon: 127.436771 },
  { lat: 37.658895, lon: 127.443958 },
  { lat: 37.65152, lon: 127.46469 },
  { lat: 37.636107, lon: 127.481468 },
  { lat: 37.616761, lon: 127.491177 },
  { lat: 37.600355, lon: 127.491863 },
  { lat: 37.594614, lon: 127.48555 },
  { lat: 37.602058, lon: 127.487572 },
  { lat: 37.594918, lon: 127.481846 },
  { lat: 37.591721, lon: 127.475849 },
  { lat: 37.58021, lon: 127.458703 },
  { lat: 37.543339, lon: 127.463127 },
  { lat: 37.51873, lon: 127.455929 },
  { lat: 37.514591, lon: 127.436258 },
  { lat: 37.516395, lon: 127.401716 },
  { lat: 37.516342, lon: 127.379302 },
  { lat: 37.532556, lon: 127.364666 },
  { lat: 37.545654, lon: 127.328888 },
];

export const dongbu5gogaeSummary: CourseSummary = {
  id: DONG_BU_5_GOGAE_ID,
  title: '동부5고개 (벗서명다유)',
  distanceKm: 68.91,
  estimatedDurationMin: 276,
  loop: true,
  pathPreview: path,
  featuredRank: 1,
  tags: ['climb', 'featured', 'seed-gpx'],
  verifiedStatus: 'curated',
  sourceType: 'curated',
};

export const dongbu5gogaeDetail: CourseDetail = {
  ...dongbu5gogaeSummary,
  visibility: 'public',
  sourceType: 'curated',
  verifiedStatus: 'curated',
  loop: true,
  amenitiesSummary: {
    toiletCount: 0,
    cafeCount: 0,
  },
  warnings: [],
  path,
};
