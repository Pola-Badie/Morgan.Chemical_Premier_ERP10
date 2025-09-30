import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { db } from './db';
import routes from './routes-new';
import accountingRoutes from './routes-accounting';
import ordersRoutes from './routes-orders';
import reportsRoutes from './routes-reports';
import customerPaymentsRoutes from './routes-customer-payments';
import etaRoutes from './routes-eta';
import chemicalRoutes from './routes-chemical';
import userRoutes from './routes-user';
import realtimeRoutes from './routes-realtime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.replit.app', 'https://your-domain.replit.dev']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Register API routes
app.use('/api', routes);
accountingRoutes(app);
ordersRoutes(app);
app.use('/api', reportsRoutes);
customerPaymentsRoutes(app);
etaRoutes(app);
chemicalRoutes(app);
app.use('/api', userRoutes);
app.use('/api', realtimeRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

async function startServer() {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Production server running on http://0.0.0.0:${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔒 Security headers enabled`);
      console.log(`⚡ Compression enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();