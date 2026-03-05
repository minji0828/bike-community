import {
  AuthTokenResponse,
  ApiResponse,
  CourseComment,
  CourseMeetup,
  CourseMeetupCreateRequest,
  CourseCreateRequest,
  CourseFromRidingCreateRequest,
  CourseDetail,
  CourseSummary,
  KakaoLoginRequest,
  PointDto,
  RidingCreateRequest,
  Toilet,
} from '../types/bikeoasis';
import {
  DONG_BU_5_GOGAE_ID,
  dongbu5gogaeDetail,
  dongbu5gogaeSummary,
} from '../mock/dongbu5gogae';
import { useSettingsStore } from '../state/settingsStore';
import { deleteJson, getJson, getText, postJson, postText } from './client';

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter((v) => v.length > 0);
  }
  return [];
}

function normalizePoint(raw: any): PointDto {
  return {
    lat: asNumber(raw?.lat ?? raw?.latitude),
    lon: asNumber(raw?.lon ?? raw?.lng ?? raw?.longitude),
  };
}

function normalizeToilet(raw: any): Toilet {
  const latitude = asNumber(raw?.latitude ?? raw?.lat);
  const longitude = asNumber(raw?.longitude ?? raw?.lon ?? raw?.lng);

  return {
    name: String(raw?.name ?? ''),
    address: String(raw?.address ?? ''),
    latitude,
    longitude,
    lat: latitude,
    lon: longitude,
    openingHours: String(raw?.openingHours ?? ''),
  } as Toilet;
}

function normalizeCourseSummary(raw: any): CourseSummary {
  const previewPath = Array.isArray(raw?.path)
    ? raw.path.map(normalizePoint)
    : Array.isArray(raw?.points)
      ? raw.points.map(normalizePoint)
      : undefined;

  return {
    id: asNumber(raw?.id ?? raw?.courseId),
    title: String(raw?.title ?? raw?.name ?? '제목 없음 코스'),
    distanceKm: asNumber(raw?.distanceKm ?? raw?.distance_km ?? raw?.distance),
    estimatedDurationMin: asNumber(
      raw?.estimatedDurationMin ?? raw?.durationMin ?? raw?.estimatedTimeMin
    ),
    loop: Boolean(raw?.loop),
    pathPreview: previewPath,
    tags: asStringArray(raw?.tags),
    featuredRank:
      raw?.featuredRank === undefined || raw?.featuredRank === null
        ? undefined
        : asNumber(raw?.featuredRank),
    verifiedStatus:
      raw?.verifiedStatus === undefined || raw?.verifiedStatus === null
        ? undefined
        : String(raw?.verifiedStatus),
    sourceType:
      raw?.sourceType === undefined || raw?.sourceType === null
        ? undefined
        : String(raw?.sourceType),
  };
}

function normalizeCourseDetail(raw: any): CourseDetail {
  return {
    ...normalizeCourseSummary(raw),
    visibility: String(raw?.visibility ?? 'public'),
    sourceType: String(raw?.sourceType ?? 'ugc'),
    verifiedStatus: String(raw?.verifiedStatus ?? 'unverified'),
    loop: Boolean(raw?.loop),
    amenitiesSummary: {
      toiletCount: asNumber(raw?.amenitiesSummary?.toiletCount ?? raw?.toiletCount),
      cafeCount: asNumber(raw?.amenitiesSummary?.cafeCount ?? raw?.cafeCount),
    },
    warnings: Array.isArray(raw?.warnings)
      ? raw.warnings.map((w: any) => ({
          type: String(w?.type ?? 'warning'),
          severity: asNumber(w?.severity, 1),
          lat: w?.lat === undefined ? undefined : asNumber(w?.lat),
          lon: w?.lon === undefined ? undefined : asNumber(w?.lon),
          radiusM: w?.radiusM === undefined ? undefined : asNumber(w?.radiusM),
          note: w?.note === undefined || w?.note === null ? undefined : String(w?.note),
          validUntil:
            w?.validUntil === undefined || w?.validUntil === null
              ? undefined
              : String(w?.validUntil),
        }))
      : [],
    path: Array.isArray(raw?.path)
      ? raw.path.map(normalizePoint)
      : Array.isArray(raw?.points)
        ? raw.points.map(normalizePoint)
        : [],
  };
}

function normalizeMeetup(raw: any): CourseMeetup {
  return {
    meetupId: asNumber(raw?.meetupId),
    courseId: asNumber(raw?.courseId),
    title: String(raw?.title ?? ''),
    status: String(raw?.status ?? 'open'),
    startAt: String(raw?.startAt ?? ''),
    meetingPointLat:
      raw?.meetingPointLat === undefined || raw?.meetingPointLat === null
        ? null
        : asNumber(raw?.meetingPointLat),
    meetingPointLon:
      raw?.meetingPointLon === undefined || raw?.meetingPointLon === null
        ? null
        : asNumber(raw?.meetingPointLon),
    capacity:
      raw?.capacity === undefined || raw?.capacity === null
        ? null
        : asNumber(raw?.capacity),
    participantCount: asNumber(raw?.participantCount),
    joined: Boolean(raw?.joined),
    host: Boolean(raw?.host),
  };
}

function unwrap<T>(res: ApiResponse<T> | T): T {
  if (!res) throw new Error('Empty response');
  if (typeof res === 'object' && res !== null && 'code' in (res as any) && 'data' in (res as any)) {
    const wrapped = res as ApiResponse<T>;
    if (wrapped.code !== 200) {
      throw new Error(wrapped.message || `API error (code=${wrapped.code})`);
    }
    return wrapped.data;
  }
  return res as T;
}

function optionalAuthHeaders() {
  const token = useSettingsStore.getState().accessToken;
  if (!token || token.trim().length === 0) return undefined;
  return { Authorization: `Bearer ${token}` };
}

function requiredAuthHeaders() {
  const headers = optionalAuthHeaders();
  if (!headers) {
    throw new Error('인증 토큰이 없습니다. 설정에서 카카오 로그인(코드 교환)을 먼저 진행해 주세요.');
  }
  return headers;
}

export async function getNearbyToilets(params: {
  lat: number;
  lon: number;
  radius: number;
}): Promise<Toilet[]> {
  const res = await getJson<ApiResponse<any[]>>('/api/v1/pois/nearby', {
    lat: params.lat,
    lon: params.lon,
    radius: params.radius,
  });
  const rows = unwrap(res);
  return Array.isArray(rows) ? rows.map(normalizeToilet) : [];
}

export async function getToiletsAlongRoute(params: {
  path: PointDto[];
  radius: number;
}): Promise<Toilet[]> {
  const res = await postJson<ApiResponse<Toilet[]>>(
    '/api/v1/pois/along-route',
    params.path,
    {
      radius: params.radius,
    }
  );
  return unwrap(res);
}

export async function createRiding(request: RidingCreateRequest): Promise<number> {
  try {
    const json = await postJson<ApiResponse<{ ridingId: number }>>('/api/v1/ridings', request);
    const data = unwrap(json);
    const id = Number((data as any)?.ridingId);
    if (Number.isFinite(id)) {
      return id;
    }
  } catch {
    // backward compatibility fallback (legacy plain number response)
  }
  const text = await postText('/api/v1/ridings', request);
  const fallbackId = Number(text);
  if (!Number.isFinite(fallbackId)) {
    throw new Error(`Unexpected riding id response: ${text}`);
  }
  return fallbackId;
}

export async function getFeaturedCourses(region?: string): Promise<CourseSummary[]> {
  try {
    const res = await getJson<ApiResponse<any[]> | any[]>('/api/v1/courses/featured', {
      region,
    });
    const rows = unwrap(res);
    const normalized = Array.isArray(rows)
      ? rows.map(normalizeCourseSummary).filter((c) => Number.isFinite(c.id) && c.id > 0)
      : [];
    if (normalized.length > 0) return normalized;
    return [dongbu5gogaeSummary];
  } catch {
    return [dongbu5gogaeSummary];
  }
}

export async function getCourseDetail(courseId: number): Promise<CourseDetail> {
  try {
    const res = await getJson<ApiResponse<any> | any>(`/api/v1/courses/${courseId}`);
    return normalizeCourseDetail(unwrap(res));
  } catch {
    if (courseId === DONG_BU_5_GOGAE_ID) {
      return dongbu5gogaeDetail;
    }
    throw new Error('코스 상세를 불러오지 못했습니다.');
  }
}

export async function createCourse(request: CourseCreateRequest): Promise<number> {
  const res = await postJson<ApiResponse<{ courseId: number }>>('/api/v1/courses', request);
  const data = unwrap(res);
  return data.courseId;
}

export async function createCourseFromRiding(
  request: CourseFromRidingCreateRequest
): Promise<number> {
  const res = await postJson<ApiResponse<{ courseId: number }>>(
    '/api/v1/courses/from-riding',
    request
  );
  const data = unwrap(res);
  return data.courseId;
}

export async function issueCourseShare(courseId: number): Promise<string> {
  const res = await postJson<ApiResponse<{ shareId: string }>>(`/api/v1/courses/${courseId}/share`);
  return unwrap(res).shareId;
}

export async function loginWithKakao(request: KakaoLoginRequest): Promise<AuthTokenResponse> {
  const res = await postJson<ApiResponse<AuthTokenResponse>>('/api/v1/auth/kakao', request);
  return unwrap(res);
}

export async function listCourseComments(
  courseId: number,
  params?: { cursor?: number; limit?: number }
): Promise<CourseComment[]> {
  const res = await getJson<ApiResponse<CourseComment[]>>(
    `/api/v1/courses/${courseId}/comments`,
    {
      cursor: params?.cursor,
      limit: params?.limit ?? 20,
    },
    optionalAuthHeaders()
  );
  return unwrap(res);
}

export async function createCourseComment(courseId: number, body: string): Promise<number> {
  const res = await postJson<ApiResponse<{ commentId: number }>>(
    `/api/v1/courses/${courseId}/comments`,
    { body },
    undefined,
    requiredAuthHeaders()
  );
  return unwrap(res).commentId;
}

export async function deleteCourseComment(commentId: number): Promise<void> {
  await deleteJson<ApiResponse<string>>(
    `/api/v1/comments/${commentId}`,
    undefined,
    requiredAuthHeaders()
  );
}

export async function reportCourseComment(
  commentId: number,
  payload: { reason: string; note?: string }
): Promise<number> {
  const res = await postJson<ApiResponse<{ reportId: number }>>(
    `/api/v1/comments/${commentId}/reports`,
    payload,
    undefined,
    requiredAuthHeaders()
  );
  return unwrap(res).reportId;
}

export async function getCourseGpx(courseId: number): Promise<string> {
  return getText(`/api/v1/courses/${courseId}/gpx`);
}

export async function listCourseMeetups(courseId: number): Promise<CourseMeetup[]> {
  const res = await getJson<ApiResponse<any[]>>(`/api/v1/courses/${courseId}/meetups`, {
    status: 'all',
  }, optionalAuthHeaders());
  const rows = unwrap(res);
  return Array.isArray(rows) ? rows.map(normalizeMeetup) : [];
}

export async function createCourseMeetup(
  courseId: number,
  payload: CourseMeetupCreateRequest
): Promise<number> {
  const res = await postJson<ApiResponse<{ meetupId: number }>>(
    `/api/v1/courses/${courseId}/meetups`,
    payload,
    undefined,
    requiredAuthHeaders()
  );
  return unwrap(res).meetupId;
}

export async function joinCourseMeetup(meetupId: number): Promise<void> {
  await postJson<ApiResponse<string>>(
    `/api/v1/meetups/${meetupId}/join`,
    undefined,
    undefined,
    requiredAuthHeaders()
  );
}

export async function leaveCourseMeetup(meetupId: number): Promise<void> {
  await postJson<ApiResponse<string>>(
    `/api/v1/meetups/${meetupId}/leave`,
    undefined,
    undefined,
    requiredAuthHeaders()
  );
}

export async function syncToilets(
  mode: 'full' | 'incremental' | 'auto' = 'auto',
  adminApiKey?: string
) {
  const path =
    mode === 'full'
      ? '/api/v1/pois/sync/full'
      : mode === 'incremental'
        ? '/api/v1/pois/sync/incremental'
        : '/api/v1/pois/sync/toilets';

  const headers =
    adminApiKey && adminApiKey.trim().length > 0
      ? { 'X-Admin-Key': adminApiKey.trim() }
      : undefined;
  const res = await postJson<ApiResponse<string>>(path, undefined, undefined, headers);
  return unwrap(res);
}
