import {
  ApiResponse,
  CourseCreateRequest,
  CourseDetail,
  CourseSummary,
  PointDto,
  RidingCreateRequest,
  Toilet,
} from '../types/bikeoasis';
import {
  DONG_BU_5_GOGAE_ID,
  dongbu5gogaeDetail,
  dongbu5gogaeSummary,
} from '../mock/dongbu5gogae';
import { getJson, postJson, postText } from './client';

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

export async function getNearbyToilets(params: {
  lat: number;
  lon: number;
  radius: number;
}): Promise<Toilet[]> {
  const res = await getJson<ApiResponse<Toilet[]>>('/api/v1/pois/nearby', {
    lat: params.lat,
    lon: params.lon,
    radius: params.radius,
  });
  return unwrap(res);
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
  const text = await postText('/api/v1/ridings', request);
  const id = Number(text);
  if (!Number.isFinite(id)) {
    throw new Error(`Unexpected riding id response: ${text}`);
  }
  return id;
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

export async function issueCourseShare(courseId: number): Promise<string> {
  const res = await postJson<ApiResponse<{ shareId: string }>>(`/api/v1/courses/${courseId}/share`);
  return unwrap(res).shareId;
}
