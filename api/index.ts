import express, { Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

// Import middleware
import { apiRateLimit, sanitizeInput } from '../server/middleware/auth.js';
import { errorHandler, notFound, logger } from '../server/middleware/errorHandler.js';
import { initializeDatabase } from '../server/config/database.js';
import { requestTimeout } from '../server/middleware/requestLogger.js';

// Create Express app for serverless
const app = express();

// Initialize database connection
initializeDatabase().catch(error => {
    console.error('Failed to initialize database:', error);
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Request processing
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://erp-morgan.vercel.app', /\.vercel\.app$/]
        : ["http://localhost:5173", "http://0.0.0.0:5173"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Apply middleware
app.use(apiRateLimit);
app.use(sanitizeInput);
app.use(requestTimeout);

// Import and register routes
async function setupRoutes() {
    try {
        // Import route handlers
        const { registerRoutes } = await import('../server/routes-new.js');
        const { registerOrderRoutes } = await import('../server/routes-orders.js');
        const { registerReportsRoutes } = await import('../server/routes-reports.js');
        const { registerAccountingRoutes } = await import('../server/routes-accounting.js');
        const { registerCustomerPaymentRoutes } = await import('../server/routes-customer-payments.js');
        const { registerETARoutes } = await import('../server/routes-eta.js');
        const { registerChemicalRoutes } = await import('../server/routes-chemical.js');
        const { registerUnifiedAccountingRoutes } = await import('../server/routes-unified-accounting.js');
        const { registerSalesDetailEndpoint } = await import('../server/sales-detail-endpoint.js');

        // Import route modules
        const healthRoutes = await import('../server/routes/health.js');
        const realtimeRoutes = await import('../server/routes-realtime.js');
        const bulkRoutes = await import('../server/routes-bulk.js');
        const notificationRoutes = await import('../server/routes-notifications.js');
        const performanceRoutes = await import('../server/routes-performance.js');
        const v1Router = await import('../server/routes-v1.js');

        // Register basic routes
        app.use('/api/health', healthRoutes.default);
        app.use('/api/realtime', realtimeRoutes.default);
        app.use('/api/bulk', bulkRoutes.default);
        app.use('/api/notifications', notificationRoutes.default);
        app.use('/api/performance', performanceRoutes.default);
        app.use('/api/v1', v1Router.default);

        // Register main routes
        await registerRoutes(app);
        registerOrderRoutes(app);
        registerReportsRoutes(app);
        registerAccountingRoutes(app);
        registerCustomerPaymentRoutes(app);
        registerETARoutes(app);
        registerChemicalRoutes(app);
        registerUnifiedAccountingRoutes(app);
        registerSalesDetailEndpoint(app);

        logger.info("✅ All API routes registered successfully for serverless");
    } catch (error) {
        logger.error("❌ Error registering routes:", error);
        console.error("❌ Route registration failed:", error);
    }
}

// Initialize routes
setupRoutes();

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export the serverless function
export default function handler(req: Request, res: Response) {
    return app(req, res);
}
