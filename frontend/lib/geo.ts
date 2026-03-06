export type GeoPoint = {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371

export function haversineDistanceKm(from: GeoPoint, to: GeoPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180

  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const dLat = toRad(to.lat - from.lat)
  const dLon = toRad(to.lng - from.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

export function shouldAppendPoint(previous: GeoPoint | null, next: GeoPoint, minimumMeters = 5) {
  if (!previous) {
    return true
  }

  return haversineDistanceKm(previous, next) * 1000 >= minimumMeters
}
