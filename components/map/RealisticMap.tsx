'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ProcessedRoute, ProcessedStop } from '@/lib/gtfs/types';

interface RealisticMapProps {
  routes: ProcessedRoute[];
  stops: ProcessedStop[];
  className?: string;
}

export default function RealisticMap({ routes, stops, className = '' }: RealisticMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Calculate bounds
    const allLats = stops.map((s) => s.lat);
    const allLons = stops.map((s) => s.lon);

    if (allLats.length === 0) return;

    const bounds: L.LatLngBoundsExpression = [
      [Math.min(...allLats), Math.min(...allLons)],
      [Math.max(...allLats), Math.max(...allLons)],
    ];

    // Initialize map
    const map = L.map(containerRef.current, {
      preferCanvas: true,
      zoomControl: true,
    }).fitBounds(bounds, { padding: [50, 50] });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add routes
    routes.forEach((route) => {
      if (route.shapes.length === 0) return;

      // Convert shapes to Leaflet format [lat, lng]
      const latlngs: L.LatLngExpression[] = route.shapes.map(([lat, lon]) => [lat, lon]);

      // Create polyline
      const polyline = L.polyline(latlngs, {
        color: route.color,
        weight: route.type === 'metro' ? 4 : route.type === 'tram' ? 3 : 2,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      // Add popup
      polyline.bindPopup(`
        <div class="p-2">
          <div class="font-bold text-lg mb-1" style="color: ${route.color}">
            ${route.shortName}
          </div>
          <div class="text-sm text-gray-600">
            ${route.longName}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            Type: ${route.type} • ${route.stops.length} stops
          </div>
        </div>
      `);
    });

    // Add stops
    stops.forEach((stop) => {
      const size = stop.isInterchange ? 8 : stop.isTerminal ? 6 : 4;

      const circle = L.circleMarker([stop.lat, stop.lon], {
        radius: size,
        fillColor: stop.isInterchange ? '#ffffff' : '#333333',
        color: stop.isInterchange ? '#000000' : '#ffffff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);

      // Add popup
      circle.bindPopup(`
        <div class="p-2">
          <div class="font-bold mb-1">${stop.name}</div>
          <div class="text-xs text-gray-600">
            ${stop.routes.length} line${stop.routes.length !== 1 ? 's' : ''}
          </div>
          ${
            stop.isInterchange
              ? '<div class="text-xs text-blue-600 mt-1">🔄 Interchange</div>'
              : ''
          }
        </div>
      `);

      // Add label for important stops
      if (stop.isInterchange || stop.isTerminal) {
        L.marker([stop.lat, stop.lon], {
          icon: L.divIcon({
            className: 'custom-label',
            html: `
              <div style="
                font-size: 10px;
                font-weight: 600;
                color: #333;
                background: rgba(255, 255, 255, 0.9);
                padding: 2px 4px;
                border-radius: 3px;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              ">
                ${stop.name}
              </div>
            `,
            iconAnchor: [0, -10],
          }),
        }).addTo(map);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [routes, stops]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '500px' }}
    />
  );
}
