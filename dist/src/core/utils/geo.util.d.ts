export interface GeoPoint {
    type: 'Point';
    coordinates: [number, number];
}
export declare const createGeoPoint: (longitude: number, latitude: number) => GeoPoint;
export declare const calculateDistance: (point1: GeoPoint, point2: GeoPoint) => number;
export declare const createGeoNearStage: (longitude: number, latitude: number, maxDistanceMeters: number, distanceField?: string) => {
    $geoNear: {
        near: {
            type: string;
            coordinates: number[];
        };
        distanceField: string;
        maxDistance: number;
        spherical: boolean;
    };
};
export declare const createNearQuery: (longitude: number, latitude: number, maxDistanceMeters: number, minDistanceMeters?: number) => {
    $near: {
        $geometry: {
            type: string;
            coordinates: number[];
        };
        $maxDistance: number;
        $minDistance: number;
    };
};
export declare const createWithinCircleQuery: (longitude: number, latitude: number, radiusMeters: number) => {
    $geoWithin: {
        $centerSphere: (number | number[])[];
    };
};
