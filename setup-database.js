
const { Client } = require('pg');

async function setupDatabase() {
  // First connect to default postgres database to create our database
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    
    // Create database if it doesn't exist
    try {
      await adminClient.query('CREATE DATABASE premier_erp');
      console.log('✅ Database premier_erp created');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('Database premier_erp already exists');
      } else {
        throw error;
      }
    }
    
    // Create user if it doesn't exist
    try {
      await adminClient.query(`CREATE USER erp_user WITH PASSWORD 'erp_secure_password'`);
      console.log('✅ User erp_user created');
    } catch (error) {
      if (error.code === '42710') {
        console.log('User erp_user already exists');
      } else {
        throw error;
      }
    }
    
    // Grant privileges
    await adminClient.query('GRANT ALL PRIVILEGES ON DATABASE premier_erp TO erp_user');
    console.log('✅ Privileges granted');
    
  } finally {
    await adminClient.end();
  }

  // Now connect to our database and create tables
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'erp_user',
    password: 'erp_secure_password',
    database: 'premier_erp'
  });

  try {
    await client.connect();
    
    // Create basic tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        price DECIMAL(10,2),
        stock_quantity INTEGER DEFAULT 0,
        unit_of_measure VARCHAR(50),
        warehouse VARCHAR(100),
        expiry_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        order_date DATE,
        total_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database tables created successfully');
    
  } finally {
    await client.end();
  }
}

setupDatabase().catch(console.error);
