/**
 * Shared in-memory cache for GTFS data and layouts
 *
 * In production, this should be replaced with Redis or a persistent cache.
 * For now, this provides a simple in-memory cache shared across API routes.
 */

// Cache for parsed GTFS data
export const parsedDataCache = new Map<string, any>();

// Cache for generated layouts
export const layoutCache = new Map<string, any>();

/**
 * Clear all caches (useful for memory management)
 */
export function clearAllCaches(): void {
  parsedDataCache.clear();
  layoutCache.clear();
}

/**
 * Remove a specific upload from cache
 */
export function removeFromCache(uploadId: string): void {
  parsedDataCache.delete(uploadId);

  // Remove all layout variations for this upload
  const layoutKeys = Array.from(layoutCache.keys());
  layoutKeys.forEach(key => {
    if (key.startsWith(uploadId)) {
      layoutCache.delete(key);
    }
  });
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    parsedDataCount: parsedDataCache.size,
    layoutCount: layoutCache.size,
  };
}
