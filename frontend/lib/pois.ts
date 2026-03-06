import { apiFetch } from '@/lib/api'
import type { POI } from '@/lib/sample-data'

export type ToiletPoiResponse = {
  name: string
  address: string
  lat: number
  lon: number
  openingHours: string | null
}

export async function getNearbyToilets(lat: number, lon: number, radius = 500) {
  return apiFetch<ToiletPoiResponse[]>(`/api/v1/pois/nearby?lat=${lat}&lon=${lon}&radius=${radius}`, {
    method: 'GET',
  })
}

export async function getAlongRouteToilets(path: Array<{ lat: number; lon: number }>, radius = 100) {
  return apiFetch<ToiletPoiResponse[]>(`/api/v1/pois/along-route?radius=${radius}`, {
    method: 'POST',
    body: JSON.stringify(path),
  })
}

export function toPoiModel(poi: ToiletPoiResponse): POI {
  return {
    id: `${poi.lat}-${poi.lon}-${poi.name}`,
    type: 'toilet',
    name: poi.name,
    lat: poi.lat,
    lng: poi.lon,
  }
}
