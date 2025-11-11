import { calculateAngle, snapToOctilinear, distance } from '../utils/geometry';
import type { LayoutNode, LayoutEdge } from '../gtfs/types';

/**
 * Apply octilinear constraints to edges
 * Snaps edges to 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315° angles
 */
export function applyOctilinearLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  scale: number = 10000
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  // Scale coordinates to work in pixel space
  const scaledNodes = nodes.map((node) => ({
    ...node,
    x: node.originalLon * scale,
    y: node.originalLat * scale,
  }));

  // Apply octilinear constraints iteratively
  const iterations = 50;
  const edgeMap = new Map<string, LayoutEdge[]>();

  // Build adjacency map
  for (const edge of edges) {
    if (!edgeMap.has(edge.source)) {
      edgeMap.set(edge.source, []);
    }
    if (!edgeMap.has(edge.target)) {
      edgeMap.set(edge.target, []);
    }
    edgeMap.get(edge.source)!.push(edge);
    edgeMap.get(edge.target)!.push(edge);
  }

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < scaledNodes.length; i++) {
      const node = scaledNodes[i];
      const nodeEdges = edgeMap.get(node.id) || [];

      if (nodeEdges.length === 0) continue;

      // Calculate ideal position based on octilinear constraints
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      for (const edge of nodeEdges) {
        const isSource = edge.source === node.id;
        const otherId = isSource ? edge.target : edge.source;
        const other = scaledNodes.find((n) => n.id === otherId);

        if (!other) continue;

        // Calculate current angle
        const angle = calculateAngle(
          [node.y, node.x],
          [other.y, other.x]
        );

        // Snap to octilinear
        const snappedAngle = snapToOctilinear(angle);

        // Calculate ideal position to maintain snapped angle
        const dist = distance([node.y, node.x], [other.y, other.x]);

        const idealAngleRad = (snappedAngle * Math.PI) / 180;
        const idealX = other.x - Math.cos(idealAngleRad) * dist;
        const idealY = other.y - Math.sin(idealAngleRad) * dist;

        sumX += idealX;
        sumY += idealY;
        count++;
      }

      if (count > 0) {
        // Move node towards ideal position (with damping)
        const alpha = 0.1 / (iter + 1); // Decrease influence over iterations
        node.x += alpha * (sumX / count - node.x);
        node.y += alpha * (sumY / count - node.y);
      }
    }
  }

  // Update edges with octilinear angles
  const updatedEdges = edges.map((edge) => {
    const source = scaledNodes.find((n) => n.id === edge.source);
    const target = scaledNodes.find((n) => n.id === edge.target);

    if (!source || !target) return edge;

    const angle = calculateAngle(
      [source.y, source.x],
      [target.y, target.x]
    );
    const snappedAngle = snapToOctilinear(angle);

    return {
      ...edge,
      angle: snappedAngle,
      points: [
        [source.y, source.x] as [number, number],
        [target.y, target.x] as [number, number],
      ],
    };
  });

  return {
    nodes: scaledNodes,
    edges: updatedEdges,
  };
}

/**
 * Normalize coordinates to fit in viewport
 */
export function normalizeCoordinates(
  nodes: LayoutNode[],
  width: number = 1200,
  height: number = 800,
  padding: number = 50
): LayoutNode[] {
  if (nodes.length === 0) return nodes;

  // Find bounds
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  const scaleX = (width - 2 * padding) / rangeX;
  const scaleY = (height - 2 * padding) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  // Normalize
  return nodes.map((node) => ({
    ...node,
    x: (node.x - minX) * scale + padding,
    y: (node.y - minY) * scale + padding,
  }));
}

/**
 * Calculate octilinear path between two points
 */
export function octilinearPath(
  from: [number, number],
  to: [number, number]
): [number, number][] {
  const [x1, y1] = from;
  const [x2, y2] = to;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // Direct line if already octilinear
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const snapped = snapToOctilinear(angle);

  if (Math.abs(angle - snapped) < 5) {
    return [from, to];
  }

  // Create intermediate point for two-segment path
  // Prefer horizontal/vertical first
  if (Math.abs(dx) > Math.abs(dy)) {
    // Go horizontal then vertical
    const mid: [number, number] = [x2, y1];
    return [from, mid, to];
  } else {
    // Go vertical then horizontal
    const mid: [number, number] = [x1, y2];
    return [from, mid, to];
  }
}
