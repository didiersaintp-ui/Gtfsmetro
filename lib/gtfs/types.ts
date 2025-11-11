// GTFS Data Types
// Based on GTFS specification: https://gtfs.org/reference/static

export interface GTFSRoute {
  route_id: string;
  agency_id?: string;
  route_short_name: string;
  route_long_name: string;
  route_desc?: string;
  route_type: number; // 0=Tram, 1=Metro, 2=Rail, 3=Bus, etc.
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
  route_sort_order?: number;
}

export interface GTFSStop {
  stop_id: string;
  stop_code?: string;
  stop_name: string;
  stop_desc?: string;
  stop_lat: number;
  stop_lon: number;
  zone_id?: string;
  stop_url?: string;
  location_type?: number;
  parent_station?: string;
  stop_timezone?: string;
  wheelchair_boarding?: number;
}

export interface GTFSShape {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled?: number;
}

export interface GTFSTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
  direction_id?: number;
  block_id?: string;
  shape_id?: string;
  wheelchair_accessible?: number;
  bikes_allowed?: number;
}

export interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  stop_headsign?: string;
  pickup_type?: number;
  drop_off_type?: number;
  shape_dist_traveled?: number;
}

// Processed data types for our application

export type TransportType =
  | 'metro'
  | 'tram'
  | 'bus'
  | 'rail'
  | 'ferry'
  | 'cableTram'
  | 'aerialLift'
  | 'funicular'
  | 'trolleybus'
  | 'monorail'
  | 'other';

export interface ProcessedRoute {
  id: string;
  shortName: string;
  longName: string;
  type: TransportType;
  color: string;
  textColor: string;
  stops: ProcessedStop[];
  shapes: [number, number][]; // [lat, lon][]
  tripCount: number;
}

export interface ProcessedStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  routes: string[]; // route IDs
  isInterchange: boolean; // Has multiple routes
  isTerminal: boolean; // Start or end of a line
}

export interface GTFSStats {
  routeCount: number;
  stopCount: number;
  tripCount: number;
  routesByType: Record<TransportType, number>;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export interface ParsedGTFSData {
  routes: ProcessedRoute[];
  stops: ProcessedStop[];
  stats: GTFSStats;
  uploadId: string;
  timestamp: number;
}

// Metro map layout types

export interface LayoutNode {
  id: string;
  originalLat: number;
  originalLon: number;
  x: number; // Schematic x coordinate
  y: number; // Schematic y coordinate
  stop: ProcessedStop;
  degree: number; // Number of connections
}

export interface LayoutEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  route: ProcessedRoute;
  points: [number, number][]; // Intermediate points
  angle?: number; // For octilinear layout
}

export interface MetroMapLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  scale: number;
}

// API response types

export interface UploadResponse {
  success: boolean;
  uploadId: string;
  fileName: string;
  fileSize: number;
}

export interface ParseResponse {
  success: boolean;
  data: ParsedGTFSData;
  processingTime: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}
