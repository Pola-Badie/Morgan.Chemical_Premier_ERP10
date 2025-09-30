import { Request, Response, NextFunction } from 'express';
import { logger } from './errorHandler.js';

// Memory usage tracker
let lastMemoryCheck = Date.now();
const MEMORY_CHECK_INTERVAL = 60000; // Check every minute

export const memoryMonitor = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  
  if (now - lastMemoryCheck > MEMORY_CHECK_INTERVAL) {
    lastMemoryCheck = now;
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    
    logger.info(`Memory usage - Heap: ${heapUsedMB}/${heapTotalMB} MB, RSS: ${rssMB} MB`);
    
    // Warn if memory usage is high
    if (heapUsedMB > 500) {
      logger.warn(`High memory usage detected: ${heapUsedMB} MB`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Forced garbage collection');
      }
    }
  }
  
  next();
};

// Request timeout middleware
export const requestTimeout = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.error(`Request timeout: ${req.method} ${req.url}`);
        res.status(408).json({ error: 'Request timeout' });
      }
    }, timeout);

    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};