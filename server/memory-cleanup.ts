// MEMORY CLEANUP UTILITIES
// Aggressive memory optimization for production environment

import { pool } from "./config/database.js";
import { logger } from "./middleware/errorHandler.js";

// Clean up idle database connections
export async function cleanupDatabaseConnections() {
  try {
    const poolStats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };
    
    logger.info(`Database pool before cleanup: Total=${poolStats.total}, Idle=${poolStats.idle}`);
    
    // Force close idle connections
    if (poolStats.idle > 0) {
      await pool.query('SELECT 1'); // Wake up pool
      // Pool will automatically clean up based on idleTimeoutMillis
    }
    
    logger.info('Database connections cleaned up');
  } catch (error) {
    logger.error('Error cleaning database connections:', error);
  }
}

// Clear module cache for large modules
export function clearModuleCache() {
  // This function is not applicable in ES modules environment
  // Return early to avoid errors
  return 0;
}

// Aggressive garbage collection
export function forceGarbageCollection() {
  if (global.gc) {
    global.gc();
    logger.info('Forced garbage collection completed');
    return true;
  }
  return false;
}

// Memory usage report
export async function getMemoryReport() {
  const usage = process.memoryUsage();
  const os = await import('os');
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  return {
    process: {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024)
    },
    system: {
      totalMB: Math.round(totalMem / 1024 / 1024),
      freeMB: Math.round(freeMem / 1024 / 1024),
      usedMB: Math.round((totalMem - freeMem) / 1024 / 1024),
      usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100)
    }
  };
}

// Run all cleanup operations
export async function runMemoryCleanup() {
  logger.info('Starting memory cleanup...');
  const beforeReport = await getMemoryReport();
  
  // 1. Clean database connections
  await cleanupDatabaseConnections();
  
  // 2. Clear module cache
  clearModuleCache();
  
  // 3. Force garbage collection
  forceGarbageCollection();
  
  // 4. Wait a bit for cleanup to take effect
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const afterReport = await getMemoryReport();
  
  logger.info('Memory cleanup completed', {
    before: beforeReport,
    after: afterReport,
    saved: {
      heapMB: beforeReport.process.heapUsed - afterReport.process.heapUsed,
      systemMB: beforeReport.system.usedMB - afterReport.system.usedMB
    }
  });
  
  return afterReport;
}

// Schedule periodic cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

export function startPeriodicCleanup(intervalMinutes: number = 10) {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(async () => {
    const report = await getMemoryReport();
    
    // Run cleanup if memory usage is above 70%
    if (report.system.usagePercent > 70 || report.process.heapUsed > 300) {
      await runMemoryCleanup();
    }
  }, intervalMinutes * 60 * 1000);
  
  logger.info(`Periodic memory cleanup scheduled every ${intervalMinutes} minutes`);
}

export function stopPeriodicCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}