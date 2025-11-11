import type { ProcessedRoute, ProcessedStop } from '../gtfs/types';

export interface GeoJSONFeature {
  type: 'Feature';
  properties: any;
  geometry: {
    type: 'LineString' | 'Point';
    coordinates: number[][] | number[];
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Convert route shapes to GeoJSON LineString features
 */
export function routesToGeoJSON(routes: ProcessedRoute[]): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = routes
    .filter((route) => route.shapes.length > 0)
    .map((route) => ({
      type: 'Feature' as const,
      properties: {
        id: route.id,
        name: route.shortName,
        longName: route.longName,
        type: route.type,
        color: route.color,
        textColor: route.textColor,
        tripCount: route.tripCount,
      },
      geometry: {
        type: 'LineString' as const,
        // GeoJSON uses [lon, lat] format
        coordinates: route.shapes.map(([lat, lon]) => [lon, lat]),
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Convert stops to GeoJSON Point features
 */
export function stopsToGeoJSON(stops: ProcessedStop[]): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = stops.map((stop) => ({
    type: 'Feature' as const,
    properties: {
      id: stop.id,
      name: stop.name,
      routes: stop.routes,
      routeCount: stop.routes.length,
      isInterchange: stop.isInterchange,
      isTerminal: stop.isTerminal,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [stop.lon, stop.lat], // [lon, lat]
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Get bounds from features
 */
export function getBounds(features: GeoJSONFeature[]): [[number, number], [number, number]] {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const feature of features) {
    if (feature.geometry.type === 'Point') {
      const [lon, lat] = feature.geometry.coordinates as number[];
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    } else if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates as number[][];
      for (const [lon, lat] of coords) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
      }
    }
  }

  return [
    [minLat, minLon],
    [maxLat, maxLon],
  ];
}
