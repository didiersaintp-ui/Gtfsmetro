'use client';

import { useEffect, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, ZoomBehavior } from 'd3-zoom';
import type { MetroMapLayout } from '@/lib/gtfs/types';

interface MetroMapProps {
  layout: MetroMapLayout;
  className?: string;
}

export default function MetroMap({ layout, className = '' }: MetroMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = select(svgRef.current);
    const g = select(gRef.current);

    // Setup zoom behavior
    const zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoomBehavior);

    // Initial zoom to fit
    const initialTransform = zoomIdentity
      .translate(0, 0)
      .scale(1);

    svg.call(zoomBehavior.transform, initialTransform);

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  return (
    <div className={`relative w-full h-full bg-white dark:bg-gray-900 ${className}`}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: '500px', cursor: 'grab' }}
      >
        <defs>
          {/* Arrow marker for terminal stations */}
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>

          {/* Drop shadow filter */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        <g ref={gRef}>
          {/* Render edges (lines) */}
          {layout.edges.map((edge, i) => {
            const isSelected = selectedRoute === edge.route.id;
            const isOtherSelected = selectedRoute && selectedRoute !== edge.route.id;

            const strokeWidth = isSelected
              ? 6
              : isOtherSelected
              ? 2
              : edge.route.type === 'metro'
              ? 4
              : edge.route.type === 'tram'
              ? 3
              : 2;

            const opacity = isOtherSelected ? 0.2 : 0.9;

            // Create path from points
            const pathData =
              edge.points.length > 0
                ? `M ${edge.points.map((p) => `${p[1]},${p[0]}`).join(' L ')}`
                : '';

            return (
              <g key={`edge-${i}`}>
                <path
                  d={pathData}
                  stroke={edge.route.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={opacity}
                  className="metro-line transition-all duration-200 cursor-pointer"
                  onClick={() =>
                    setSelectedRoute(
                      selectedRoute === edge.route.id ? null : edge.route.id
                    )
                  }
                  onMouseEnter={(e) => {
                    const target = e.currentTarget;
                    target.style.strokeWidth = '6';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget;
                    target.style.strokeWidth = strokeWidth.toString();
                  }}
                >
                  <title>
                    {edge.route.shortName} - {edge.route.longName}
                  </title>
                </path>
              </g>
            );
          })}

          {/* Render nodes (stations) */}
          {layout.nodes.map((node, i) => {
            const baseSize = node.stop.isInterchange ? 8 : node.stop.isTerminal ? 6 : 4;
            const size = baseSize * (1 + node.degree * 0.1);

            return (
              <g key={`node-${i}`} className="metro-station">
                {/* Station circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size}
                  fill={node.stop.isInterchange ? '#ffffff' : '#333333'}
                  stroke={node.stop.isInterchange ? '#000000' : '#ffffff'}
                  strokeWidth={2}
                  filter="url(#shadow)"
                  className="transition-all duration-200 cursor-pointer"
                >
                  <title>{node.stop.name}</title>
                </circle>

                {/* Station label for important stations */}
                {(node.stop.isInterchange || node.stop.isTerminal || node.degree > 2) && (
                  <text
                    x={node.x + size + 4}
                    y={node.y + 4}
                    className="metro-label"
                    fill="currentColor"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {node.stop.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
        <h3 className="font-bold mb-3 text-sm">Lines</h3>
        <div className="space-y-2">
          {Array.from(
            new Map(layout.edges.map((edge) => [edge.route.id, edge.route])).values()
          ).map((route) => {
            const isSelected = selectedRoute === route.id;
            return (
              <button
                key={route.id}
                onClick={() => setSelectedRoute(isSelected ? null : route.id)}
                className={`
                  flex items-center gap-2 w-full text-left p-2 rounded transition-colors
                  ${isSelected ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                `}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: route.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{route.shortName}</div>
                  <div className="text-xs text-gray-500 truncate">{route.longName}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
        <div>🖱️ Drag to pan • 🔍 Scroll to zoom</div>
      </div>
    </div>
  );
}
