import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { Client } from 'pg';
import { createServer } from 'net';
import { exec } from 'child_process';

// Import middleware
import { apiRateLimit, sanitizeInput } from "./middleware/auth.js";
import { errorHandler, notFound, logger } from "./middleware/errorHandler.js";
import { initializeDatabase, closeDatabaseConnection } from "./config/database.js";
import { memoryMonitor, requestTimeout } from "./middleware/requestLogger.js";
import { startPeriodicCleanup, stopPeriodicCleanup, runMemoryCleanup } from "./memory-cleanup.js";

// Import routes
import healthRoutes from "./routes/health.js";
import realtimeRoutes from './routes-realtime.js';
import bulkRoutes from './routes-bulk.js';
import notificationRoutes from './routes-notifications.js';
import performanceRoutes from './routes-performance.js';
import v1Router from './routes-v1.js';

// Import Vite setup for development
import { setupVite } from "./vite.js";

// Import route handlers with error handling
async function importRoutes() {
  try {
    const { registerRoutes } = await import("./routes-new.js");
    const { registerOrderRoutes } = await import("./routes-orders.js");
    const { registerReportsRoutes } = await import("./routes-reports.js");
    const { registerAccountingRoutes } = await import("./routes-accounting.js");
    const { registerCustomerPaymentRoutes } = await import("./routes-customer-payments.js");
    const { registerETARoutes } = await import("./routes-eta.js");
    const { registerChemicalRoutes } = await import("./routes-chemical.js");
    const { registerUnifiedAccountingRoutes } = await import("./routes-unified-accounting.js");
    const { registerSalesDetailEndpoint } = await import("./sales-detail-endpoint.js");

    return {
      registerRoutes,
      registerOrderRoutes,
      registerReportsRoutes,
      registerAccountingRoutes,
      registerCustomerPaymentRoutes,
      registerETARoutes,
      registerChemicalRoutes,
      registerUnifiedAccountingRoutes,
      registerSalesDetailEndpoint
    };
  } catch (error) {
    logger.error("Failed to import route modules:", error);
    return null;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// 🛡️ Port Conflict Prevention System
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, () => {
      server.close(() => resolve(false)); // Port is free
    });
    server.on('error', () => resolve(true)); // Port is in use
  });
}

async function killProcessOnPort(port: number): Promise<void> {
  try {
    // Use netstat-like approach to find and kill processes on port
    await new Promise((resolve, reject) => {
      exec(`fuser -k ${port}/tcp 2>/dev/null || true`, (error: any) => {
        // Always resolve, even if no process was found
        resolve(true);
      });
    });

    // Wait a moment for processes to cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info(`🧹 Cleaned up any existing processes on port ${port}`);
  } catch (error) {
    logger.warn(`Could not kill processes on port ${port}, continuing anyway`);
  }
}

async function ensurePortAvailable(port: number): Promise<void> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const inUse = await isPortInUse(port);

    if (!inUse) {
      logger.info(`✅ Port ${port} is available`);
      return;
    }

    logger.warn(`⚠️ Port ${port} is in use (attempt ${attempt}/${maxRetries}), attempting cleanup...`);
    await killProcessOnPort(port);

    // Check again after cleanup
    const stillInUse = await isPortInUse(port);
    if (!stillInUse) {
      logger.info(`🔧 Successfully freed port ${port}`);
      return;
    }

    if (attempt === maxRetries) {
      throw new Error(`EADDRINUSE: Port ${port} is still in use after ${maxRetries} cleanup attempts`);
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Trust proxy for rate limiting - enable for all environments to fix X-Forwarded-For error
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: NODE_ENV === 'production'
    ? ['https://your-domain.com', 'https://www.your-domain.com']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiRateLimit);

// Input sanitization
app.use(sanitizeInput);

// Memory monitoring - disabled to reduce overhead
// app.use(memoryMonitor);

// Request timeout (30 seconds)
app.use(requestTimeout(30000));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(logLevel, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
});

// Static file serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

// 🔒 SECURITY: Bulk routes now properly secured with authentication
console.log('🔒 Registering SECURED bulk routes...');

// Health check routes (before other routes)
app.use('/api', healthRoutes);

// NEW: Clean v1 API routes with REAL database functionality (includes bulk routes)
app.use('/api/v1', v1Router);

// Permission Management Routes (REAL API)
console.log('🔐 Registering REAL permission management routes...');
import permissionRoutes from './routes-permissions.js';
app.use('/api', permissionRoutes);

// Seed permissions asynchronously (non-blocking)
setTimeout(async () => {
  console.log('🌱 Seeding permissions asynchronously...');
  try {
    const { permissionSeeder } = await import('./services/permission-seeder.js');
    await permissionSeeder.seedAll();
    console.log('✅ Permissions seeded successfully');
  } catch (error) {
    console.error('❌ Permission seeding failed:', error);
  }
}, 2000); // Start seeding 2 seconds after server starts

app.use('/api', realtimeRoutes);
app.use('/api', notificationRoutes);
app.use('/api', performanceRoutes);

// API Routes
async function setupRoutes() {
  const routes = await importRoutes();

  if (!routes) {
    logger.warn("⚠️ Running in minimal mode - only health endpoints available");
    return;
  }

  try {
    console.log('🔧 Starting route registration...');

    await routes.registerRoutes(app);
    console.log('✅ registerRoutes completed');

    routes.registerOrderRoutes(app);
    console.log('✅ registerOrderRoutes completed');

    routes.registerReportsRoutes(app);
    console.log('✅ registerReportsRoutes completed');

    routes.registerAccountingRoutes(app);
    console.log('✅ registerAccountingRoutes completed');

    routes.registerCustomerPaymentRoutes(app);
    console.log('✅ registerCustomerPaymentRoutes completed');

    routes.registerETARoutes(app);
    console.log('✅ registerETARoutes completed');

    routes.registerChemicalRoutes(app);
    console.log('✅ registerChemicalRoutes completed');

    routes.registerUnifiedAccountingRoutes(app);
    console.log('✅ registerUnifiedAccountingRoutes completed');

    routes.registerSalesDetailEndpoint(app);
    console.log('✅ registerSalesDetailEndpoint completed');

    logger.info("✅ All API routes registered successfully");
  } catch (error) {
    logger.error("❌ Error registering routes:", error);
    console.error("❌ Route registration failed:", error);
  }
}

// Development vs Production frontend serving
if (NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler (only for production or non-Vite routes)
if (NODE_ENV === 'production') {
  app.use(notFound);
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Global server reference
let globalServer: any = null;

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  if (globalServer) {
    globalServer.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Stop periodic cleanup
        stopPeriodicCleanup();

        await closeDatabaseConnection();
        logger.info('Database connections closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  }

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Initialize and start server
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();

    // Wait a moment for database to be fully ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Setup routes
    await setupRoutes();

    // Start server
    // 🛡️ ENSURE PORT IS AVAILABLE BEFORE STARTING
    await ensurePortAvailable(PORT);

    const server = app.listen(PORT, "0.0.0.0", async () => {
      logger.info(`🚀 Premier ERP System running on port ${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`📋 Health check: http://localhost:${PORT}/api/health`);

      // Health check endpoint
      app.get("/health", (_req: Request, res: Response) => {
        res.json({
          status: "healthy",
          timestamp: new Date().toISOString(),
          database: "connected",
          version: "1.0.0"
        });
      });

      // Data sync endpoint - active implementation
      app.post("/api/sync-data", async (_req: Request, res: Response) => {
        try {
          const { syncAllData } = await import("./sync-data.js");
          const result = await syncAllData();
          res.json(result);
        } catch (error) {
          logger.error("Data sync failed:", error);
          res.status(500).json({ error: "Sync failed" });
        }
      });

      // Memory cleanup endpoint
      app.post("/api/memory-cleanup", async (_req: Request, res: Response) => {
        try {
          const report = await runMemoryCleanup();
          res.json({ success: true, report });
        } catch (error) {
          logger.error("Memory cleanup failed:", error);
          res.status(500).json({ error: "Cleanup failed" });
        }
      });

      // Start periodic memory cleanup
      startPeriodicCleanup(5); // Check every 5 minutes

      // Setup Vite middleware for development
      if (NODE_ENV === 'development') {
        try {
          await setupVite(app, server);
          logger.info(`🌐 Frontend: http://localhost:${PORT}/`);
          logger.info(`🌐 API Base: http://localhost:${PORT}/api/`);
        } catch (error) {
          logger.error('Failed to setup Vite middleware:', error);
        }
      }
    });

    // Store server reference globally
    globalServer = server;

    // Graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors to prevent crashes
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
      // Don't exit - keep the app running
    });

    process.on('uncaughtException', (error: any) => {
      logger.error('Uncaught Exception:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });

      // 🛡️ HANDLE PORT CONFLICTS GRACEFULLY
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use! This should not happen with our port management system.`);
        logger.info('🔧 Attempting emergency port cleanup...');

        killProcessOnPort(PORT).then(() => {
          logger.info('🔄 Port cleaned up, restarting server...');
          setTimeout(() => {
            process.exit(1); // Let the process manager restart us
          }, 2000);
        }).catch(() => {
          logger.error('💥 Could not clean up port, forcing exit...');
          process.exit(1);
        });
        return;
      }

      // Only exit for truly fatal errors
      const nonFatalErrors = ['57P01', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED'];
      if (error.code && nonFatalErrors.includes(error.code)) {
        logger.warn('Non-fatal error detected, keeping app running');
        return;
      }

      // For unknown errors, try to recover
      if (!error.code) {
        logger.warn('Unknown error type, attempting to continue');
        return;
      }

      logger.error('Fatal error detected, exiting...');
      gracefulShutdown('FATAL_ERROR');
    });

    return server;
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
(async () => {
  try {
    const server = await startServer();
    globalServer = server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

export default app;