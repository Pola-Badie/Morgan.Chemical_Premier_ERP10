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

// Global flag to track initialization
let isInitialized = false;

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

// Simple test route for serverless
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Serverless function is working'
    });
});

// Add orders route directly
app.get('/api/orders', (req, res) => {
    try {
        // Return test orders data
        const orders = [
            {
                id: 1,
                orderNumber: "ORD-PHM-2025-001",
                batchNumber: "BATCH-IBU-001",
                orderType: "production",
                customerName: "Cairo Medical Center",
                finalProduct: "Ibuprofen Tablets 400mg",
                orderDate: "2025-01-15",
                completionDate: "2025-02-14",
                status: "completed",
                totalCost: 45000,
                revenue: 54150,
                profit: 9150,
                createdAt: "2025-01-15T08:00:00.000Z"
            }
        ];

        res.json(orders);
    } catch (error) {
        console.error('Orders endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Import and register routes
async function setupRoutes() {
    try {
        console.log("✅ Basic routes registered for serverless");
        isInitialized = true;
    } catch (error) {
        console.error("❌ Error registering routes:", error);
        throw error;
    }
}

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export the serverless function
export default async function handler(req: Request, res: Response) {
    try {
        // Initialize on first request (without database for now)
        if (!isInitialized) {
            await setupRoutes();
        }

        return app(req, res);
    } catch (error) {
        console.error('Handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
