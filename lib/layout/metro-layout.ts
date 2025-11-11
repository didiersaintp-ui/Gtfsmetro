import type { ProcessedRoute, ProcessedStop, MetroMapLayout } from '../gtfs/types';
import {
  buildGraph,
  simplifyGraph,
  simplifyRouteShapes,
  detectTerminals,
} from './simplification';
import { applyOctilinearLayout, normalizeCoordinates } from './octilinear';
import { applyForceDirectedLayout, applyConstrainedForce } from './force-directed';

/**
 * Generate complete metro-like schematic layout
 */
export async function generateMetroLayout(
  routes: ProcessedRoute[],
  stops: ProcessedStop[],
  options: {
    width?: number;
    height?: number;
    simplify?: boolean;
  } = {}
): Promise<MetroMapLayout> {
  const { width = 1200, height = 800, simplify = true } = options;

  console.log('Starting metro layout generation...');
  console.log(`Input: ${routes.length} routes, ${stops.length} stops`);

  // Step 1: Mark terminals
  const terminals = detectTerminals(routes);
  const updatedStops = stops.map((stop) => ({
    ...stop,
    isTerminal: terminals.has(stop.id),
  }));

  // Step 2: Simplify route shapes
  const simplifiedRoutes = simplifyRouteShapes(routes, 0.0003);

  // Step 3: Build graph structure
  console.log('Building graph...');
  let { nodes, edges } = buildGraph(simplifiedRoutes, updatedStops);

  // Step 4: Simplify graph (optional, removes intermediate stops)
  if (simplify && nodes.length > 100) {
    console.log('Simplifying graph...');
    ({ nodes, edges } = simplifyGraph(nodes, edges));
  }

  if (nodes.length === 0) {
    throw new Error('No nodes to layout');
  }

  // Step 5: Apply octilinear layout
  console.log('Applying octilinear layout...');
  ({ nodes, edges } = applyOctilinearLayout(nodes, edges, 10000));

  // Step 6: Apply force-directed optimization
  console.log('Applying force-directed optimization...');
  ({ nodes, edges } = applyConstrainedForce(nodes, edges, {
    iterations: 200,
    alpha: 0.05,
  }));

  // Step 7: Normalize coordinates to fit viewport
  console.log('Normalizing coordinates...');
  nodes = normalizeCoordinates(nodes, width, height, 50);

  // Update edge points with normalized coordinates
  edges = edges.map((edge) => {
    const source = nodes.find((n) => n.id === edge.source);
    const target = nodes.find((n) => n.id === edge.target);

    if (!source || !target) return edge;

    return {
      ...edge,
      points: [
        [source.y, source.x] as [number, number],
        [target.y, target.x] as [number, number],
      ],
    };
  });

  console.log(`Layout complete: ${nodes.length} nodes, ${edges.length} edges`);

  return {
    nodes,
    edges,
    width,
    height,
    scale: 1,
  };
}

/**
 * Generate realistic geographic layout (no schematization)
 */
export function generateRealisticLayout(
  routes: ProcessedRoute[],
  stops: ProcessedStop[],
  options: {
    width?: number;
    height?: number;
  } = {}
): MetroMapLayout {
  const { width = 1200, height = 800 } = options;

  // Build graph with original coordinates
  const { nodes, edges } = buildGraph(routes, stops);

  // Just normalize to viewport without transformation
  const normalizedNodes = normalizeCoordinates(nodes, width, height, 50);

  // Update edge points
  const updatedEdges = edges.map((edge) => {
    const source = normalizedNodes.find((n) => n.id === edge.source);
    const target = normalizedNodes.find((n) => n.id === edge.target);

    if (!source || !target) return edge;

    // Use route shapes if available
    const points: [number, number][] =
      edge.route.shapes.length > 0
        ? edge.route.shapes
        : [[source.y, source.x] as [number, number], [target.y, target.x] as [number, number]];

    return {
      ...edge,
      points,
    };
  });

  return {
    nodes: normalizedNodes,
    edges: updatedEdges,
    width,
    height,
    scale: 1,
  };
}
