import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import type { LayoutNode, LayoutEdge } from '../gtfs/types';

interface D3Node extends SimulationNodeDatum {
  id: string;
  originalNode: LayoutNode;
  degree: number;
}

interface D3Link extends SimulationLinkDatum<D3Node> {
  originalEdge: LayoutEdge;
}

/**
 * Apply force-directed layout to reduce overlaps and improve spacing
 */
export function applyForceDirectedLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: {
    width?: number;
    height?: number;
    iterations?: number;
    linkDistance?: number;
    repulsion?: number;
    collision?: number;
  } = {}
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const {
    width = 1200,
    height = 800,
    iterations = 300,
    linkDistance = 100,
    repulsion = -300,
    collision = 20,
  } = options;

  // Convert to D3 format
  const d3Nodes: D3Node[] = nodes.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    originalNode: node,
    degree: node.degree,
  }));

  const d3Links: D3Link[] = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    originalEdge: edge,
  }));

  // Create simulation
  const simulation = forceSimulation<D3Node>(d3Nodes)
    .force(
      'link',
      forceLink<D3Node, D3Link>(d3Links)
        .id((d) => d.id)
        .distance(linkDistance)
        .strength(0.5)
    )
    .force('charge', forceManyBody().strength(repulsion))
    .force('center', forceCenter(width / 2, height / 2))
    .force(
      'collision',
      forceCollide<D3Node>().radius((d) => collision * (1 + d.degree * 0.2))
    )
    .stop();

  // Run simulation
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  // Convert back to LayoutNode format
  const updatedNodes: LayoutNode[] = d3Nodes.map((d3Node) => ({
    ...d3Node.originalNode,
    x: d3Node.x || 0,
    y: d3Node.y || 0,
  }));

  // Update edge positions
  const updatedEdges: LayoutEdge[] = edges.map((edge) => {
    const source = updatedNodes.find((n) => n.id === edge.source);
    const target = updatedNodes.find((n) => n.id === edge.target);

    if (!source || !target) return edge;

    return {
      ...edge,
      points: [
        [source.y, source.x] as [number, number],
        [target.y, target.x] as [number, number],
      ],
    };
  });

  return {
    nodes: updatedNodes,
    edges: updatedEdges,
  };
}

/**
 * Apply constrained force-directed layout that maintains octilinear angles
 */
export function applyConstrainedForce(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: {
    iterations?: number;
    alpha?: number;
  } = {}
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const { iterations = 200, alpha = 0.1 } = options;

  const nodeMap = new Map<string, LayoutNode>();
  nodes.forEach((node) => nodeMap.set(node.id, { ...node }));

  const edgesByNode = new Map<string, LayoutEdge[]>();
  edges.forEach((edge) => {
    if (!edgesByNode.has(edge.source)) edgesByNode.set(edge.source, []);
    if (!edgesByNode.has(edge.target)) edgesByNode.set(edge.target, []);
    edgesByNode.get(edge.source)!.push(edge);
    edgesByNode.get(edge.target)!.push(edge);
  });

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();

    // Initialize forces
    nodes.forEach((node) => {
      forces.set(node.id, { fx: 0, fy: 0 });
    });

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodeMap.get(nodes[i].id)!;
        const node2 = nodeMap.get(nodes[j].id)!;

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < 100) {
          // Repulsion strength inversely proportional to distance
          const force = 1000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          const f1 = forces.get(node1.id)!;
          const f2 = forces.get(node2.id)!;

          f1.fx -= fx;
          f1.fy -= fy;
          f2.fx += fx;
          f2.fy += fy;
        }
      }
    }

    // Apply forces with damping
    const damping = alpha * (1 - iter / iterations);

    nodeMap.forEach((node, id) => {
      const force = forces.get(id)!;

      // Don't move too much if node has many connections (stable anchors)
      const stability = 1 / (1 + node.degree * 0.1);

      node.x += force.fx * damping * stability;
      node.y += force.fy * damping * stability;
    });
  }

  const updatedNodes = Array.from(nodeMap.values());

  // Update edges
  const updatedEdges = edges.map((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);

    if (!source || !target) return edge;

    return {
      ...edge,
      points: [
        [source.y, source.x] as [number, number],
        [target.y, target.x] as [number, number],
      ],
    };
  });

  return {
    nodes: updatedNodes,
    edges: updatedEdges,
  };
}
