import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { logger } from '../middleware/errorHandler.js';
import * as schema from "../../shared/schema.js";

const isDevelopment = process.env.NODE_ENV === 'development';

// Database configuration
const dbConfig = {
  connectionString: "postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: false, // خليها False
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  maxUses: 1000,
  allowExitOnIdle: false,
  statement_timeout: 60000,
  query_timeout: 60000,
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Health check
export const checkDatabaseHealth = async (retries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    let client;
    try {
      client = await pool.connect();
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      if (attempt === retries) {
        logger.error('Database health check failed after all retries:', error);
        return false;
      }
      logger.warn(`Health check attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    } finally {
      if (client) client.release();
    }
  }
  return false;
};

// Initialize
export const initializeDatabase = async (): Promise<void> => {
  const healthy = await checkDatabaseHealth();
  if (healthy) {
    logger.info('✅ Database connection established successfully');
  } else {
    throw new Error('❌ Database health check failed');
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  await pool.end();
  logger.info('Database connection pool closed');
};

// Event handlers
pool.on('connect', () => {
  if (isDevelopment) logger.info('New database client connected');
});

pool.on('error', (err) => {
  logger.error('Database pool error:', err);
  if ((err as any).code === '57P01') {
    logger.warn('Database connection terminated by administrator - will reconnect automatically');
  }
});

pool.on('remove', () => {
  if (isDevelopment) logger.info('Database client removed from pool');
});

export default db;
