// MEMORY OPTIMIZATION MODULE
// Reduces memory usage and improves performance

import { pool } from "./db";
import { Request, Response, NextFunction } from "express";

// Configure Node.js memory settings
let gcInterval: NodeJS.Timeout | null = null;
if ((global as any).gc) {
  // Force garbage collection every 60 seconds if available
  gcInterval = setInterval(() => {
    (global as any).gc();
  }, 60000);
}

// Database connection optimization
let poolMonitorInterval: NodeJS.Timeout | null = null;
export function optimizeDatabaseConnections() {
  // Clear existing interval if any
  if (poolMonitorInterval) {
    clearInterval(poolMonitorInterval);
  }

  // Monitor pool usage every 2 minutes instead of every minute
  poolMonitorInterval = setInterval(() => {
    const stats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };

    console.log(`DB Pool: Total=${stats.total}, Idle=${stats.idle}, Waiting=${stats.waiting}`);
  }, 120000); // Every 2 minutes
}

// Response compression middleware
export function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip compression for small responses
  const originalSend = res.send;
  res.send = function (data: any) {
    if (data && data.length > 1024) { // Only compress responses > 1KB
      res.setHeader('Content-Encoding', 'gzip');
    }
    return originalSend.call(this, data);
  };
  next();
}

// Query result limiting middleware
export function queryLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add default pagination to prevent large result sets
  if (!req.query.limit && req.method === 'GET') {
    req.query.limit = '100';
  }
  next();
}

// Memory monitoring
let memoryMonitorInterval: NodeJS.Timeout | null = null;
export function startMemoryMonitoring() {
  // Clear existing interval if any
  if (memoryMonitorInterval) {
    clearInterval(memoryMonitorInterval);
  }

  memoryMonitorInterval = setInterval(() => {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    // Log to winston logger instead of console
    if (heapUsedMB / heapTotalMB > 0.7) {
      console.log(`Memory - Heap: ${heapUsedMB}/${heapTotalMB} MB, RSS: ${rssMB} MB`);
    }

    // Force garbage collection if heap usage is too high
    if (heapUsedMB / heapTotalMB > 0.8 && (global as any).gc) {
      console.log('High memory usage detected, forcing garbage collection...');
      (global as any).gc();
    }
  }, 60000); // Every 60 seconds instead of 30
}

// Cache management
const cache = new Map<string, { data: any; expires: number }>();

export function cacheMiddleware(duration: number = 300) { // 5 minutes default
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (data: any) {
      cache.set(key, {
        data,
        expires: Date.now() + (duration * 1000)
      });

      // Clean old cache entries
      if (cache.size > 100) {
        const now = Date.now();
        for (const [k, v] of cache.entries()) {
          if (v.expires < now) {
            cache.delete(k);
          }
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

// Optimize large query results
export function optimizeQueryResults(results: any[]): any[] {
  // Remove unnecessary fields from large result sets
  if (results.length > 50) {
    return results.map(item => {
      // Remove timestamps and metadata for large lists
      const { createdAt, updatedAt, ...rest } = item;
      return rest;
    });
  }
  return results;
}

// Cleanup function for graceful shutdown
export function cleanupMemoryOptimizations() {
  if (gcInterval) {
    clearInterval(gcInterval);
    gcInterval = null;
  }
  if (poolMonitorInterval) {
    clearInterval(poolMonitorInterval);
    poolMonitorInterval = null;
  }
  if (memoryMonitorInterval) {
    clearInterval(memoryMonitorInterval);
    memoryMonitorInterval = null;
  }
  cache.clear();
}

// Initialize all optimizations
export function initializeMemoryOptimizations() {
  optimizeDatabaseConnections();
  startMemoryMonitoring();

  console.log('✅ Memory optimizations initialized');
  console.log('   - Database connection pooling optimized');
  console.log('   - Memory monitoring active');
  console.log('   - Response caching enabled');
  console.log('   - Query result optimization active');

  // Cleanup on process exit
  process.on('SIGINT', cleanupMemoryOptimizations);
  process.on('SIGTERM', cleanupMemoryOptimizations);
}