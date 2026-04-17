/**
 * Geo Utilities
 * Helper functions for geospatial queries and calculations
 */

/**
 * GeoJSON Point interface
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Create a GeoJSON Point from coordinates
 */
export const createGeoPoint = (
  longitude: number,
  latitude: number,
): GeoPoint => ({
  type: 'Point',
  coordinates: [longitude, latitude],
});

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  point1: GeoPoint,
  point2: GeoPoint,
): number => {
  const R = 6371; // Earth's radius in kilometers

  const lat1 = toRadians(point1.coordinates[1]);
  const lat2 = toRadians(point2.coordinates[1]);
  const deltaLat = toRadians(point2.coordinates[1] - point1.coordinates[1]);
  const deltaLon = toRadians(point2.coordinates[0] - point1.coordinates[0]);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Generate MongoDB $geoNear aggregation stage
 */
export const createGeoNearStage = (
  longitude: number,
  latitude: number,
  maxDistanceMeters: number,
  distanceField: string = 'distance',
) => ({
  $geoNear: {
    near: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    distanceField,
    maxDistance: maxDistanceMeters,
    spherical: true,
  },
});

/**
 * Generate MongoDB $near query
 */
export const createNearQuery = (
  longitude: number,
  latitude: number,
  maxDistanceMeters: number,
  minDistanceMeters: number = 0,
) => ({
  $near: {
    $geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    $maxDistance: maxDistanceMeters,
    $minDistance: minDistanceMeters,
  },
});

/**
 * Generate MongoDB $geoWithin query for a circle
 */
export const createWithinCircleQuery = (
  longitude: number,
  latitude: number,
  radiusMeters: number,
) => ({
  $geoWithin: {
    $centerSphere: [[longitude, latitude], radiusMeters / 6378100], // Convert meters to radians
  },
});
