export type GeoPoint = {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371
const METERS_PER_LAT_DEGREE = 111_320

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

export function computePathDistanceKm(path: GeoPoint[]) {
  if (path.length < 2) {
    return 0
  }

  let totalKm = 0
  for (let index = 1; index < path.length; index += 1) {
    totalKm += haversineDistanceKm(path[index - 1], path[index])
  }

  return totalKm
}

export type PathProgressSnapshot = {
  nearestPoint: GeoPoint
  nearestSegmentIndex: number
  distanceFromPathMeters: number
  traveledDistanceKm: number
  totalDistanceKm: number
  progressPercent: number
}

export function getPathProgress(path: GeoPoint[], current: GeoPoint): PathProgressSnapshot {
  if (path.length === 0) {
    return {
      nearestPoint: current,
      nearestSegmentIndex: 0,
      distanceFromPathMeters: 0,
      traveledDistanceKm: 0,
      totalDistanceKm: 0,
      progressPercent: 0,
    }
  }

  if (path.length === 1) {
    return {
      nearestPoint: path[0],
      nearestSegmentIndex: 0,
      distanceFromPathMeters: haversineDistanceKm(path[0], current) * 1000,
      traveledDistanceKm: 0,
      totalDistanceKm: 0,
      progressPercent: 0,
    }
  }

  const totalDistanceKm = computePathDistanceKm(path)
  let bestSnapshot: PathProgressSnapshot | null = null
  let cumulativeBeforeSegmentKm = 0

  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1]
    const end = path[index]
    const segmentDistanceKm = haversineDistanceKm(start, end)
    const projection = projectPointOnSegment(current, start, end)
    const traveledDistanceKm = cumulativeBeforeSegmentKm + segmentDistanceKm * projection.ratio
    const progressPercent = totalDistanceKm > 0 ? Math.min((traveledDistanceKm / totalDistanceKm) * 100, 100) : 0

    const candidate: PathProgressSnapshot = {
      nearestPoint: projection.point,
      nearestSegmentIndex: index - 1,
      distanceFromPathMeters: projection.distanceMeters,
      traveledDistanceKm,
      totalDistanceKm,
      progressPercent,
    }

    if (!bestSnapshot || candidate.distanceFromPathMeters < bestSnapshot.distanceFromPathMeters) {
      bestSnapshot = candidate
    }

    cumulativeBeforeSegmentKm += segmentDistanceKm
  }

  return bestSnapshot ?? {
    nearestPoint: path[0],
    nearestSegmentIndex: 0,
    distanceFromPathMeters: haversineDistanceKm(path[0], current) * 1000,
    traveledDistanceKm: 0,
    totalDistanceKm,
    progressPercent: 0,
  }
}

export function isOffRoute(distanceFromPathMeters: number, thresholdMeters = 30) {
  return distanceFromPathMeters > thresholdMeters
}

function projectPointOnSegment(point: GeoPoint, start: GeoPoint, end: GeoPoint) {
  const averageLatRadians = (((point.lat + start.lat + end.lat) / 3) * Math.PI) / 180
  const metersPerLngDegree = METERS_PER_LAT_DEGREE * Math.cos(averageLatRadians)

  const segmentVector = {
    x: (end.lng - start.lng) * metersPerLngDegree,
    y: (end.lat - start.lat) * METERS_PER_LAT_DEGREE,
  }
  const pointVector = {
    x: (point.lng - start.lng) * metersPerLngDegree,
    y: (point.lat - start.lat) * METERS_PER_LAT_DEGREE,
  }

  const segmentLengthSquared = segmentVector.x ** 2 + segmentVector.y ** 2
  const unclampedRatio =
    segmentLengthSquared === 0
      ? 0
      : (pointVector.x * segmentVector.x + pointVector.y * segmentVector.y) / segmentLengthSquared
  const ratio = Math.max(0, Math.min(1, unclampedRatio))

  const projectedMeters = {
    x: segmentVector.x * ratio,
    y: segmentVector.y * ratio,
  }

  return {
    ratio,
    point: {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    },
    distanceMeters: Math.hypot(pointVector.x - projectedMeters.x, pointVector.y - projectedMeters.y),
  }
}
