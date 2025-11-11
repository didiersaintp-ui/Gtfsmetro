/**
 * Performance monitoring utilities
 */

export class PerformanceTimer {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
  }

  /**
   * End the timer and return elapsed time in milliseconds
   */
  end(): number {
    const elapsed = Date.now() - this.startTime;
    console.log(`⏱️ ${this.name}: ${elapsed}ms`);
    return elapsed;
  }

  /**
   * Log a checkpoint without ending the timer
   */
  checkpoint(label: string): void {
    const elapsed = Date.now() - this.startTime;
    console.log(`⏱️ ${this.name} [${label}]: ${elapsed}ms`);
  }
}

/**
 * Create a new performance timer
 */
export function startTimer(name: string): PerformanceTimer {
  return new PerformanceTimer(name);
}

/**
 * Format milliseconds to human-readable duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  const remainingMs = ms % 1000;

  if (seconds < 60) {
    return `${seconds}.${Math.floor(remainingMs / 100)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Memory usage statistics
 */
export function getMemoryUsage(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
} | null {
  if (typeof process === 'undefined') return null;

  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
    rss: Math.round(usage.rss / 1024 / 1024),
  };
}

/**
 * Log memory usage
 */
export function logMemoryUsage(label: string = 'Memory'): void {
  const usage = getMemoryUsage();
  if (!usage) return;

  console.log(
    `💾 ${label}: Heap ${usage.heapUsed}/${usage.heapTotal} MB, RSS ${usage.rss} MB`
  );
}
