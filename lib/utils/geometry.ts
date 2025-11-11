import * as turf from '@turf/turf';

/**
 * Calculate distance between two points in meters
 */
export function distance(
  point1: [number, number],
  point2: [number, number]
): number {
  const from = turf.point([point1[1], point1[0]]); // [lon, lat]
  const to = turf.point([point2[1], point2[0]]);
  return turf.distance(from, to, { units: 'meters' });
}

/**
 * Simplify a line using Douglas-Peucker algorithm
 */
export function simplifyLine(
  coordinates: [number, number][],
  tolerance: number = 0.0001
): [number, number][] {
  if (coordinates.length < 3) return coordinates;

  // Convert to GeoJSON format [lon, lat]
  const line = turf.lineString(
    coordinates.map(([lat, lon]) => [lon, lat])
  );

  const simplified = turf.simplify(line, {
    tolerance,
    highQuality: true,
  });

  // Convert back to [lat, lon]
  return simplified.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
}

/**
 * Calculate angle between two points in degrees (0-360)
 */
export function calculateAngle(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const dy = lat2 - lat1;
  const dx = lon2 - lon1;

  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize to 0-360
  if (angle < 0) {
    angle += 360;
  }

  return angle;
}

/**
 * Snap angle to nearest octilinear angle (0, 45, 90, 135, 180, 225, 270, 315)
 */
export function snapToOctilinear(angle: number): number {
  const octilinearAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];

  let closest = 0;
  let minDiff = Infinity;

  for (const octAngle of octilinearAngles) {
    const diff = Math.abs(angle - octAngle);
    if (diff < minDiff) {
      minDiff = diff;
      closest = octAngle;
    }
  }

  return closest % 360;
}

/**
 * Calculate bearing between two points
 */
export function bearing(
  point1: [number, number],
  point2: [number, number]
): number {
  const from = turf.point([point1[1], point1[0]]);
  const to = turf.point([point2[1], point2[0]]);
  return turf.bearing(from, to);
}

/**
 * Get point at distance along a line
 */
export function pointAlong(
  line: [number, number][],
  distance: number
): [number, number] {
  const lineString = turf.lineString(
    line.map(([lat, lon]) => [lon, lat])
  );
  const along = turf.along(lineString, distance, { units: 'meters' });
  const [lon, lat] = along.geometry.coordinates;
  return [lat, lon];
}

/**
 * Calculate centroid of points
 */
export function centroid(points: [number, number][]): [number, number] {
  const features = turf.featureCollection(
    points.map(([lat, lon]) => turf.point([lon, lat]))
  );
  const center = turf.centroid(features);
  const [lon, lat] = center.geometry.coordinates;
  return [lat, lon];
}

/**
 * Check if point is within buffer distance of line
 */
export function isPointNearLine(
  point: [number, number],
  line: [number, number][],
  bufferDistance: number
): boolean {
  const pt = turf.point([point[1], point[0]]);
  const lineString = turf.lineString(
    line.map(([lat, lon]) => [lon, lat])
  );
  const dist = turf.pointToLineDistance(pt, lineString, { units: 'meters' });
  return dist <= bufferDistance;
}
