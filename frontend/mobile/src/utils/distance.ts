export function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000; // meters
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function formatMeters(meters: number) {
  if (!Number.isFinite(meters)) return '-';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

// Simple equirectangular approximation for point-to-line distance over small areas.
export function distanceToSegmentMeters(
  p: { lat: number; lon: number },
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const latRad = toRad(p.lat);
  const kx = Math.cos(latRad); // scale factor for longitude
  
  // Convert lat/lon differences to local meters approximation
  const x = (p.lon - a.lon) * kx * toRad(1) * R;
  const y = (p.lat - a.lat) * toRad(1) * R;
  const dx = (b.lon - a.lon) * kx * toRad(1) * R;
  const dy = (b.lat - a.lat) * toRad(1) * R;
  
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.sqrt(x * x + y * y); // a == b

  // t is the projection parameter
  let t = (x * dx + y * dy) / len2;
  t = Math.max(0, Math.min(1, t));

  // closest point on segment
  const cx = t * dx;
  const cy = t * dy;

  // distance from point to closest point
  const dist2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  return Math.sqrt(dist2);
}

export function minDistanceToPathMeters(p: { lat: number; lon: number }, path: { lat: number; lon: number }[]) {
  if (!path || path.length === 0) return Infinity;
  if (path.length === 1) return haversineMeters(p, path[0]);

  let minD = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const d = distanceToSegmentMeters(p, path[i], path[i + 1]);
    if (d < minD) minD = d;
  }
  return minD;
}
