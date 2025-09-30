
import express from 'express';
import os from 'os';
import { db } from './db.js';

const router = express.Router();

// System metrics
router.get('/performance/metrics', async (req, res) => {
  try {
    const metrics = {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        loadAvg: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      database: {
        connectionCount: 1, // Simplified for demo
        queryCount: 0,
        avgResponseTime: 0
      },
      application: {
        nodeVersion: process.version,
        pid: process.pid,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Database health check
router.get('/performance/health', async (req, res) => {
  try {
    const start = Date.now();

    // Test database connection
    await db.select().from('users' as any).limit(1);

    const dbResponseTime = Date.now() - start;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'healthy',
          responseTime: dbResponseTime,
          lastCheck: new Date().toISOString()
        },
        api: {
          status: 'healthy',
          responseTime: 0,
          lastCheck: new Date().toISOString()
        }
      }
    };

    res.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

export default router;
