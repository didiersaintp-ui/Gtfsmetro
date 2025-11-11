/**
 * Color utilities for transit lines and stations
 */

// Default color palette for transit lines (high contrast, distinct)
export const LINE_COLORS = [
  '#FF5733', // Red-Orange
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33A1', // Pink
  '#FFD133', // Yellow
  '#33FFF5', // Cyan
  '#A133FF', // Purple
  '#FF8C33', // Orange
  '#33FF8C', // Mint
  '#8C33FF', // Violet
  '#FF3333', // Red
  '#33FFFF', // Light Cyan
  '#FF33FF', // Magenta
  '#FF8C8C', // Light Red
  '#8CFF33', // Lime
  '#338CFF', // Sky Blue
];

/**
 * Get a color from the palette by index
 */
export function getLineColor(index: number): string {
  return LINE_COLORS[index % LINE_COLORS.length];
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate luminance of a color
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Get contrasting text color (black or white) for a background color
 */
export function getContrastColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 + percent / 100;
  const r = Math.min(255, Math.round(rgb.r * factor));
  const g = Math.min(255, Math.round(rgb.g * factor));
  const b = Math.min(255, Math.round(rgb.b * factor));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  return lightenColor(hex, -percent);
}
