import { distance, simplifyLine } from '../utils/geometry';
import type { ProcessedRoute, ProcessedStop, LayoutNode, LayoutEdge } from '../gtfs/types';

/**
 * Cluster nearby stops (merge stops within threshold distance)
 */
export function clusterStops(
  stops: ProcessedStop[],
  threshold: number = 50
): Map<string, string> {
  const clusters = new Map<string, string>(); // stopId -> clusterId
  const processed = new Set<string>();

  for (const stop of stops) {
    if (processed.has(stop.id)) continue;

    const cluster: string[] = [stop.id];
    processed.add(stop.id);

    // Find nearby stops
    for (const otherStop of stops) {
      if (processed.has(otherStop.id)) continue;

      const dist = distance(
        [stop.lat, stop.lon],
        [otherStop.lat, otherStop.lon]
      );

      if (dist <= threshold) {
        cluster.push(otherStop.id);
        processed.add(otherStop.id);
      }
    }

    // Map all stops in cluster to first stop
    const clusterId = cluster[0];
    for (const stopId of cluster) {
      clusters.set(stopId, clusterId);
    }
  }

  return clusters;
}

/**
 * Simplify route shapes to reduce complexity
 */
export function simplifyRouteShapes(
  routes: ProcessedRoute[],
  tolerance: number = 0.0002
): ProcessedRoute[] {
  return routes.map((route) => ({
    ...route,
    shapes: route.shapes.length > 0 ? simplifyLine(route.shapes, tolerance) : [],
  }));
}

/**
 * Build graph structure from routes and stops
 */
export function buildGraph(
  routes: ProcessedRoute[],
  stops: ProcessedStop[]
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const nodeMap = new Map<string, LayoutNode>();

  // Create nodes from stops
  for (const stop of stops) {
    const node: LayoutNode = {
      id: stop.id,
      originalLat: stop.lat,
      originalLon: stop.lon,
      x: stop.lon, // Will be transformed later
      y: stop.lat,
      stop,
      degree: stop.routes.length,
    };
    nodes.push(node);
    nodeMap.set(stop.id, node);
  }

  // Create edges from routes
  for (const route of routes) {
    const routeStops = route.stops;

    for (let i = 0; i < routeStops.length - 1; i++) {
      const source = routeStops[i];
      const target = routeStops[i + 1];

      if (nodeMap.has(source.id) && nodeMap.has(target.id)) {
        // Get shape points between these stops if available
        let points: [number, number][] = [];
        if (route.shapes.length > 0) {
          // Find shape points between source and target
          // For simplicity, we'll just use direct line
          points = [[source.lat, source.lon], [target.lat, target.lon]];
        }

        const edge: LayoutEdge = {
          id: `${route.id}-${source.id}-${target.id}`,
          source: source.id,
          target: target.id,
          route,
          points,
        };

        edges.push(edge);
      }
    }
  }

  return { nodes, edges };
}

/**
 * Detect terminal stops (first or last stop on a line)
 */
export function detectTerminals(routes: ProcessedRoute[]): Set<string> {
  const terminals = new Set<string>();

  for (const route of routes) {
    if (route.stops.length > 0) {
      terminals.add(route.stops[0].id); // First stop
      terminals.add(route.stops[route.stops.length - 1].id); // Last stop
    }
  }

  return terminals;
}

/**
 * Calculate node importance (for sizing in visualization)
 */
export function calculateNodeImportance(node: LayoutNode): number {
  let importance = 1;

  // Interchange stations are more important
  if (node.stop.isInterchange) {
    importance += node.degree * 0.5;
  }

  // Terminals are slightly more important
  if (node.stop.isTerminal) {
    importance += 0.5;
  }

  return importance;
}

/**
 * Remove redundant intermediate nodes (stops with only 2 connections on same line)
 */
export function simplifyGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const newNodes: LayoutNode[] = [];
  const newEdges: LayoutEdge[] = [];

  // Keep nodes that are:
  // 1. Interchange stations (degree > 1 route)
  // 2. Terminal stations
  // 3. Stations with unique characteristics

  const keepNode = (node: LayoutNode) => {
    return (
      node.stop.isInterchange ||
      node.stop.isTerminal ||
      node.degree > 1 ||
      Math.random() > 0.3 // Keep some intermediate stops randomly for realism
    );
  };

  const keptNodes = new Set<string>();
  for (const node of nodes) {
    if (keepNode(node)) {
      newNodes.push(node);
      keptNodes.add(node.id);
    }
  }

  // Update edges to connect kept nodes
  for (const edge of edges) {
    if (keptNodes.has(edge.source) && keptNodes.has(edge.target)) {
      newEdges.push(edge);
    }
  }

  console.log(`Simplified graph: ${nodes.length} → ${newNodes.length} nodes, ${edges.length} → ${newEdges.length} edges`);

  return { nodes: newNodes, edges: newEdges };
}
