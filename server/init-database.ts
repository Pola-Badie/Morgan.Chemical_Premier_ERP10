import { sql } from 'drizzle-orm';
import { db } from './config/database.js';
import * as schema from '../shared/schema.js';

export async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Create all tables from schema
    const tableCreationQuery = sql`
      -- User management tables
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT,
        role TEXT DEFAULT 'staff' NOT NULL,
        status TEXT DEFAULT 'active' NOT NULL,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        module_name TEXT NOT NULL,
        access_granted BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Product management tables
      CREATE TABLE IF NOT EXISTS product_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        drug_name TEXT NOT NULL,
        category_id INTEGER REFERENCES product_categories(id),
        description TEXT,
        sku TEXT NOT NULL UNIQUE,
        barcode TEXT,
        cost_price NUMERIC NOT NULL,
        selling_price NUMERIC NOT NULL,
        quantity INTEGER DEFAULT 0 NOT NULL,
        unit_of_measure TEXT DEFAULT 'PCS' NOT NULL,
        low_stock_threshold INTEGER DEFAULT 10,
        expiry_date DATE,
        status TEXT DEFAULT 'active' NOT NULL,
        product_type TEXT DEFAULT 'finished' NOT NULL,
        manufacturer TEXT,
        location TEXT,
        shelf TEXT,
        image_path TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Customer management
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        company TEXT,
        position TEXT,
        sector TEXT,
        tax_number TEXT DEFAULT '',
        total_purchases NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Sales management
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER REFERENCES customers(id),
        user_id INTEGER REFERENCES users(id) NOT NULL,
        date TIMESTAMP DEFAULT NOW() NOT NULL,
        total_amount NUMERIC NOT NULL,
        discount NUMERIC DEFAULT 0,
        tax NUMERIC DEFAULT 0,
        grand_total NUMERIC NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT DEFAULT 'completed' NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) NOT NULL,
        product_id INTEGER REFERENCES products(id) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC NOT NULL,
        discount NUMERIC DEFAULT 0,
        total NUMERIC NOT NULL
      );

      -- Suppliers management
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        materials TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Purchase orders
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        po_number TEXT NOT NULL UNIQUE,
        supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        order_date TIMESTAMP DEFAULT NOW() NOT NULL,
        expected_delivery_date DATE,
        status TEXT DEFAULT 'pending' NOT NULL,
        total_amount NUMERIC NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id SERIAL PRIMARY KEY,
        purchase_order_id INTEGER REFERENCES purchase_orders(id) NOT NULL,
        product_id INTEGER REFERENCES products(id) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC NOT NULL,
        total NUMERIC NOT NULL,
        received_quantity INTEGER DEFAULT 0
      );

      -- Inventory transactions
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC,
        reference_type TEXT,
        reference_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Expenses management
      CREATE TABLE IF NOT EXISTS expense_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES expense_categories(id),
        description TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        date DATE NOT NULL,
        payment_method TEXT NOT NULL,
        vendor TEXT,
        receipt_path TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Quotations
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        quotation_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER REFERENCES customers(id),
        user_id INTEGER REFERENCES users(id) NOT NULL,
        date TIMESTAMP DEFAULT NOW() NOT NULL,
        valid_until DATE,
        total_amount NUMERIC NOT NULL,
        discount NUMERIC DEFAULT 0,
        tax NUMERIC DEFAULT 0,
        grand_total NUMERIC NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quotation_items (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER REFERENCES quotations(id) NOT NULL,
        product_id INTEGER REFERENCES products(id) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC NOT NULL,
        discount NUMERIC DEFAULT 0,
        total NUMERIC NOT NULL
      );

      -- Accounting tables
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        entry_number TEXT NOT NULL UNIQUE,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id SERIAL PRIMARY KEY,
        journal_entry_id INTEGER REFERENCES journal_entries(id) NOT NULL,
        account_id INTEGER REFERENCES accounts(id) NOT NULL,
        debit NUMERIC DEFAULT 0,
        credit NUMERIC DEFAULT 0
      );

      -- Customer payments
      CREATE TABLE IF NOT EXISTS customer_payments (
        id SERIAL PRIMARY KEY,
        payment_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER REFERENCES customers(id) NOT NULL,
        invoice_id INTEGER REFERENCES sales(id),
        amount NUMERIC NOT NULL,
        payment_method TEXT NOT NULL,
        payment_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- System preferences
      CREATE TABLE IF NOT EXISTS system_preferences (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        action_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    await db.execute(tableCreationQuery);
    
    console.log('Database schema initialized successfully');
    
    // Insert default admin user if not exists
    const adminCheckQuery = sql`SELECT id FROM users WHERE username = 'admin' LIMIT 1`;
    const adminExists = await db.execute(adminCheckQuery);
    
    if (adminExists.rows.length === 0) {
      console.log('Creating default admin user...');
      await db.execute(sql`
        INSERT INTO users (username, password, name, email, role, status)
        VALUES ('admin', '$2b$10$YourHashedPasswordHere', 'Admin User', 'admin@morganerp.com', 'admin', 'active')
      `);
    }
    
    // Insert default categories if not exist
    const categoriesCheckQuery = sql`SELECT COUNT(*) as count FROM product_categories`;
    const categoriesResult = await db.execute(categoriesCheckQuery);
    
    if (categoriesResult.rows[0].count === 0) {
      console.log('Creating default product categories...');
      await db.execute(sql`
        INSERT INTO product_categories (name, description)
        VALUES 
          ('Pharmaceuticals', 'Pharmaceutical products and medicines'),
          ('Chemicals', 'Chemical compounds and raw materials'),
          ('Medical Supplies', 'Medical equipment and supplies'),
          ('Laboratory', 'Laboratory equipment and consumables')
      `);
    }
    
    // Insert default expense categories if not exist
    const expenseCategoriesCheckQuery = sql`SELECT COUNT(*) as count FROM expense_categories`;
    const expenseCategoriesResult = await db.execute(expenseCategoriesCheckQuery);
    
    if (expenseCategoriesResult.rows[0].count === 0) {
      console.log('Creating default expense categories...');
      await db.execute(sql`
        INSERT INTO expense_categories (name, description)
        VALUES 
          ('Office Supplies', 'Office and administrative supplies'),
          ('Utilities', 'Electricity, water, internet, etc.'),
          ('Rent', 'Office and warehouse rent'),
          ('Salaries', 'Employee salaries and wages'),
          ('Transportation', 'Delivery and transportation costs'),
          ('Maintenance', 'Equipment and facility maintenance')
      `);
    }
    
    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run initialization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}