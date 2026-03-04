import { ApiResponse, PointDto, RidingCreateRequest, Toilet } from '../types/bikeoasis';
import { getJson, postJson, postText } from './client';

function unwrap<T>(res: ApiResponse<T>): T {
  if (!res) throw new Error('Empty response');
  if (res.code !== 200) throw new Error(res.message || `API error (code=${res.code})`);
  return res.data;
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
