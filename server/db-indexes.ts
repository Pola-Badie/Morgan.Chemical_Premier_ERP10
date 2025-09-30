// Database Index Optimization
// Creates indexes on frequently queried columns to improve performance

import { db } from './db';
import { sql } from 'drizzle-orm';

export async function createDatabaseIndexes() {
  console.log('Creating database indexes for performance optimization...');
  
  try {
    // User indexes for authentication queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_username 
      ON users(username);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_email 
      ON users(email);
    `);
    
    // Customer indexes for search and lookup
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_name 
      ON customers(name);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_company 
      ON customers(company);
    `);
    
    // Product indexes for inventory queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_products_sku 
      ON products(sku);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_products_category_id 
      ON products(category_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_products_quantity 
      ON products(quantity);
    `);
    
    // Invoice indexes for financial reports
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_invoices_customer_id 
      ON invoices(customer_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_invoices_created_at 
      ON invoices(created_at);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_invoices_status 
      ON invoices(status);
    `);
    
    // Order indexes for order management
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
      ON orders(customer_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at 
      ON orders(created_at);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_status 
      ON orders(status);
    `);
    
    // Expense indexes for accounting
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_expenses_category_id 
      ON expenses(category_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_expenses_date 
      ON expenses(date);
    `);
    
    // Journal entries indexes for financial reports
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_journal_entries_date 
      ON journal_entries(date);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_journal_entries_account_id 
      ON journal_entries(account_id);
    `);
    
    // User permissions indexes for authorization
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
      ON user_permissions(user_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_module_name 
      ON user_permissions(module_name);
    `);
    
    // Composite index for user-module lookup
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_permissions_user_module 
      ON user_permissions(user_id, module_name);
    `);
    
    // Purchase orders indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id 
      ON purchase_orders(supplier_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_status 
      ON purchase_orders(status);
    `);
    
    // Warehouse inventory indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse_id 
      ON warehouse_inventory(warehouse_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product_id 
      ON warehouse_inventory(product_id);
    `);
    
    // Login logs index for security auditing
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_login_logs_user_id 
      ON login_logs(user_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_login_logs_timestamp 
      ON login_logs(timestamp);
    `);
    
    console.log('✅ Database indexes created successfully');
    
    // Analyze tables to update query planner statistics
    await db.execute(sql`ANALYZE;`);
    console.log('✅ Database statistics updated');
    
  } catch (error) {
    console.error('Error creating database indexes:', error);
    // Don't throw - indexes are optimization, not critical
  }
}

// Function to check existing indexes
export async function checkIndexStatus() {
  try {
    const indexes = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    
    console.log('Current database indexes:', indexes.rows.length);
    return indexes.rows;
  } catch (error) {
    console.error('Error checking index status:', error);
    return [];
  }
}

// Function to get index usage statistics
export async function getIndexUsageStats() {
  try {
    const stats = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 20;
    `);
    
    console.log('Top 20 most used indexes:');
    stats.rows.forEach(row => {
      console.log(`  ${row.indexname}: ${row.index_scans} scans`);
    });
    
    return stats.rows;
  } catch (error) {
    console.error('Error getting index usage stats:', error);
    return [];
  }
}