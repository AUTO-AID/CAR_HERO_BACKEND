"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWithinCircleQuery = exports.createNearQuery = exports.createGeoNearStage = exports.calculateDistance = exports.createGeoPoint = void 0;
const createGeoPoint = (longitude, latitude) => ({
    type: 'Point',
    coordinates: [longitude, latitude],
});
exports.createGeoPoint = createGeoPoint;
const calculateDistance = (point1, point2) => {
    const R = 6371;
    const lat1 = toRadians(point1.coordinates[1]);
    const lat2 = toRadians(point2.coordinates[1]);
    const deltaLat = toRadians(point2.coordinates[1] - point1.coordinates[1]);
    const deltaLon = toRadians(point2.coordinates[0] - point1.coordinates[0]);
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLon / 2) *
            Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.calculateDistance = calculateDistance;
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};
const createGeoNearStage = (longitude, latitude, maxDistanceMeters, distanceField = 'distance') => ({
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
exports.createGeoNearStage = createGeoNearStage;
const createNearQuery = (longitude, latitude, maxDistanceMeters, minDistanceMeters = 0) => ({
    $near: {
        $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceMeters,
        $minDistance: minDistanceMeters,
    },
});
exports.createNearQuery = createNearQuery;
const createWithinCircleQuery = (longitude, latitude, radiusMeters) => ({
    $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusMeters / 6378100],
    },
});
exports.createWithinCircleQuery = createWithinCircleQuery;
//# sourceMappingURL=geo.util.js.map