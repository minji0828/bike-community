export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type Toilet = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openingHours: string;
};

export type PointDto = {
  lat: number;
  lon: number;
};

export type RidingCreateRequest = {
  deviceUuid: string;
  userId: number | null;
  title: string;
  totalDistance: number;
  totalTime: number;
  avgSpeed: number;
  path: PointDto[];
};

export type CourseWarning = {
  type: string;
  severity: number;
  lat?: number;
  lon?: number;
  radiusM?: number;
  note?: string;
  validUntil?: string;
};

export type AmenitiesSummary = {
  toiletCount: number;
  cafeCount: number;
};

export type CourseSummary = {
  id: number;
  title: string;
  distanceKm: number;
  estimatedDurationMin: number;
  loop?: boolean;
  pathPreview?: PointDto[];
  tags: string[];
  featuredRank?: number;
  verifiedStatus?: string;
  sourceType?: string;
};

export type CourseDetail = CourseSummary & {
  visibility: string;
  sourceType: string;
  verifiedStatus: string;
  loop: boolean;
  amenitiesSummary: AmenitiesSummary;
  warnings: CourseWarning[];
  path: PointDto[];
};

export type CourseCreateRequest = {
  ownerUserId: number | null;
  deviceUuid: string;
  title: string;
  description: string;
  visibility: string;
  sourceType: string;
  path: PointDto[];
  tags?: string[];
  warnings?: Array<{
    type: string;
    severity: number;
    lat?: number;
    lon?: number;
    radiusM?: number;
    note?: string;
    validUntil?: string;
  }>;
};

export type CourseFromRidingCreateRequest = {
  ridingId: number;
  title: string;
  visibility?: string;
  sourceType?: string;
  tags?: string[];
  // Backend accepts both keys; docs historically used notes.
  notes?: string;
  description?: string;
  warnings?: Array<{
    type: string;
    severity: number;
    lat?: number;
    lon?: number;
    radiusM?: number;
    note?: string;
    validUntil?: string;
  }>;
};

export type KakaoLoginRequest = {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  nonce?: string;
};

export type AuthTokenResponse = {
  accessToken: string;
  expiresInSec: number;
};

export type CourseComment = {
  id: number;
  author: {
    displayName: string;
  };
  body: string;
  createdAt: string;
  isMine: boolean;
};
