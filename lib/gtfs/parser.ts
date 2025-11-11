import { importGtfs, getRoutes, getStops, getShapes, getTrips, getStoptimes, openDb, closeDb } from 'gtfs';
import path from 'path';
import type {
  GTFSRoute,
  GTFSStop,
  GTFSShape,
  GTFSTrip,
  ProcessedRoute,
  ProcessedStop,
  GTFSStats,
  ParsedGTFSData,
  TransportType,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Map GTFS route_type to our TransportType
function mapRouteType(routeType: number): TransportType {
  switch (routeType) {
    case 0:
      return 'tram';
    case 1:
      return 'metro';
    case 2:
      return 'rail';
    case 3:
      return 'bus';
    case 4:
      return 'ferry';
    case 5:
      return 'cableTram';
    case 6:
      return 'aerialLift';
    case 7:
      return 'funicular';
    case 11:
      return 'trolleybus';
    case 12:
      return 'monorail';
    default:
      return 'other';
  }
}

// Generate default color for route if not specified
function getRouteColor(route: any, index: number): string {
  if (route.route_color && route.route_color !== '') {
    return `#${route.route_color}`;
  }

  // Default color palette
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A1',
    '#FFD133', '#33FFF5', '#A133FF', '#FF8C33',
    '#33FF8C', '#8C33FF', '#FF3333', '#33FFFF',
    '#FF33FF', '#FF8C8C', '#8CFF33', '#338CFF',
  ];

  return colors[index % colors.length];
}

// Generate text color based on background color
function getTextColor(bgColor: string): string {
  // Simple luminance check
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export async function parseGTFS(uploadId: string, gtfsPath: string): Promise<ParsedGTFSData> {
  const dbPath = path.join(DATA_DIR, `${uploadId}.db`);

  try {
    // Import GTFS into SQLite
    const config = {
      agencies: [
        {
          path: gtfsPath,
        },
      ],
      sqlitePath: dbPath,
      verbose: false,
    };

    console.log('Importing GTFS data...');
    await importGtfs(config);

    console.log('Opening database...');
    const db = openDb(config);

    // Get all routes
    console.log('Fetching routes...');
    const routes = getRoutes() as any[];

    // Get all stops
    console.log('Fetching stops...');
    const stops = getStops() as any[];

    // Process routes
    const processedRoutes: ProcessedRoute[] = [];
    const stopRoutesMap = new Map<string, Set<string>>();

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const routeId = route.route_id;

      // Get trips for this route
      const trips = getTrips({ route_id: routeId }) as any[];

      // Get shapes for the first trip (representative)
      let shapes: [number, number][] = [];
      if (trips.length > 0 && trips[0].shape_id) {
        const shapePoints = getShapes({ shape_id: trips[0].shape_id }) as any[];
        shapes = shapePoints
          .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
          .map((point) => [point.shape_pt_lat, point.shape_pt_lon]);
      }

      // Get stops for this route
      const routeStops: ProcessedStop[] = [];
      for (const trip of trips.slice(0, 1)) {
        // Just first trip
        const stopTimes = getStoptimes({ trip_id: trip.trip_id }) as any[];
        for (const stopTime of stopTimes) {
          const stop = stops.find((s) => s.stop_id === stopTime.stop_id);
          if (stop) {
            if (!stopRoutesMap.has(stop.stop_id)) {
              stopRoutesMap.set(stop.stop_id, new Set());
            }
            stopRoutesMap.get(stop.stop_id)!.add(routeId);

            if (!routeStops.find((s) => s.id === stop.stop_id)) {
              routeStops.push({
                id: stop.stop_id,
                name: stop.stop_name,
                lat: stop.stop_lat,
                lon: stop.stop_lon,
                routes: [routeId],
                isInterchange: false,
                isTerminal: false,
              });
            }
          }
        }
      }

      const color = getRouteColor(route, i);
      const textColor = route.route_text_color
        ? `#${route.route_text_color}`
        : getTextColor(color);

      processedRoutes.push({
        id: routeId,
        shortName: route.route_short_name || route.route_long_name,
        longName: route.route_long_name,
        type: mapRouteType(route.route_type),
        color,
        textColor,
        stops: routeStops,
        shapes,
        tripCount: trips.length,
      });
    }

    // Process stops with interchange information
    const processedStops: ProcessedStop[] = stops.map((stop) => {
      const routeIds = Array.from(stopRoutesMap.get(stop.stop_id) || []);
      return {
        id: stop.stop_id,
        name: stop.stop_name,
        lat: stop.stop_lat,
        lon: stop.stop_lon,
        routes: routeIds,
        isInterchange: routeIds.length > 1,
        isTerminal: false, // Will be calculated later if needed
      };
    });

    // Calculate bounds
    const lats = processedStops.map((s) => s.lat);
    const lons = processedStops.map((s) => s.lon);

    // Calculate stats
    const routesByType: Record<TransportType, number> = {
      metro: 0,
      tram: 0,
      bus: 0,
      rail: 0,
      ferry: 0,
      cableTram: 0,
      aerialLift: 0,
      funicular: 0,
      trolleybus: 0,
      monorail: 0,
      other: 0,
    };

    for (const route of processedRoutes) {
      routesByType[route.type] = (routesByType[route.type] || 0) + 1;
    }

    const stats: GTFSStats = {
      routeCount: processedRoutes.length,
      stopCount: processedStops.length,
      tripCount: processedRoutes.reduce((sum, r) => sum + r.tripCount, 0),
      routesByType,
      bounds: {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLon: Math.min(...lons),
        maxLon: Math.max(...lons),
      },
    };

    closeDb();

    return {
      routes: processedRoutes,
      stops: processedStops,
      stats,
      uploadId,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error parsing GTFS:', error);
    throw error;
  }
}
