const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function updateAdminUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    ,
  });

  try {
    await client.connect();

    // Hash the password
    const password = 'admin123';
    const hash = bcrypt.hashSync(password, 10);

    // Update admin user
    await client.query(`
      UPDATE users 
      SET password = $1, 
          email = 'maged.morgan@morganerp.com',
          name = 'Maged Morgan'
      WHERE username = 'admin'
    `, [hash]);

    console.log('Admin user updated successfully');

    // Also insert some initial data to prevent errors
    await client.query(`
      INSERT INTO products (name, drug_name, sku, cost_price, selling_price, quantity, unit_of_measure)
      VALUES 
        ('Paracetamol 500mg', 'Paracetamol', 'PARA-500', 5.50, 12.00, 100, 'Tablets'),
        ('Amoxicillin 250mg', 'Amoxicillin', 'AMOX-250', 8.00, 18.00, 50, 'Capsules'),
        ('Aspirin 100mg', 'Aspirin', 'ASP-100', 3.00, 8.00, 200, 'Tablets')
      ON CONFLICT (sku) DO NOTHING
    `);

    console.log('Initial products added');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

updateAdminUser();