// Re-export from the main database configuration
export { pool, db, checkDatabaseHealth, initializeDatabase, closeDatabaseConnection } from './config/database.js';