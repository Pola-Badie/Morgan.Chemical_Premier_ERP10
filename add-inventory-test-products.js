import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

});

async function addInventoryTestProducts() {
  const client = await pool.connect();

  try {
    console.log('Adding inventory test products with low stock and expiring items...');

    // First, get category IDs
    const categoriesResult = await client.query('SELECT id, name FROM product_categories ORDER BY id LIMIT 3');
    const categories = categoriesResult.rows;

    if (categories.length === 0) {
      console.log('No categories found, creating default categories first...');
      await client.query(`
        INSERT INTO product_categories (name, description, created_at, updated_at) 
        VALUES 
        ('Pharmaceuticals', 'Medical and pharmaceutical products', NOW(), NOW()),
        ('Chemicals', 'Chemical compounds and reagents', NOW(), NOW()),
        ('Equipment', 'Medical and laboratory equipment', NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `);

      const newCategoriesResult = await client.query('SELECT id, name FROM product_categories ORDER BY id');
      categories.push(...newCategoriesResult.rows);
    }

    const pharmaCategoryId = categories.find(c => c.name.includes('Pharma'))?.id || categories[0]?.id;
    const chemCategoryId = categories.find(c => c.name.includes('Chem'))?.id || categories[1]?.id;

    // Test products with specific stock levels and expiry dates
    const testProducts = [
      // OUT OF STOCK PRODUCTS
      {
        name: 'Daflon 500mg - Low Stock Test',
        drug_name: 'Diosmin/Hesperidin',
        description: 'Cardiovascular medication - OUT OF STOCK',
        category_id: pharmaCategoryId,
        unit_of_measure: 'boxes',
        unit_price: 25.50,
        quantity: 0, // OUT OF STOCK
        low_stock_threshold: 50,
        reorder_quantity: 100,
        supplier_code: 'DAF-001',
        dosage: '500mg',
        manufacturer: 'Servier',
        route_of_administration: 'Oral',
        expiry_date: '2023-06-19', // EXPIRED
        manufacturing_date: '2022-06-19',
        batch_number: 'TEST-OUT-001',
        status: 'active'
      },
      {
        name: 'Vitamin C 1000mg - No Stock',
        drug_name: 'Ascorbic Acid',
        description: 'Immune support supplement - OUT OF STOCK',
        category_id: pharmaCategoryId,
        unit_of_measure: 'bottles',
        unit_price: 15.99,
        quantity: 0, // OUT OF STOCK
        low_stock_threshold: 40,
        reorder_quantity: 80,
        supplier_code: 'VIT-002',
        dosage: '1000mg',
        manufacturer: 'Nature Made',
        route_of_administration: 'Oral',
        expiry_date: '2025-10-30',
        manufacturing_date: '2024-02-10',
        batch_number: 'TEST-OUT-002',
        status: 'active'
      },

      // LOW STOCK PRODUCTS
      {
        name: 'Aspirin 500mg - Low Stock',
        drug_name: 'Acetylsalicylic Acid',
        description: 'Pain relief medication - LOW STOCK',
        category_id: pharmaCategoryId,
        unit_of_measure: 'packs',
        unit_price: 8.99,
        quantity: 10, // LOW STOCK (threshold 50)
        low_stock_threshold: 50,
        reorder_quantity: 100,
        supplier_code: 'ASP-003',
        dosage: '500mg',
        manufacturer: 'Bayer',
        route_of_administration: 'Oral',
        expiry_date: '2025-08-15',
        manufacturing_date: '2024-03-20',
        batch_number: 'TEST-LOW-001',
        status: 'active'
      },
      {
        name: 'Paracetamol 500mg - Critical Stock',
        drug_name: 'Paracetamol',
        description: 'Fever reducer - CRITICAL LOW STOCK',
        category_id: pharmaCategoryId,
        unit_of_measure: 'bottles',
        unit_price: 12.50,
        quantity: 5, // CRITICAL LOW (threshold 30)
        low_stock_threshold: 30,
        reorder_quantity: 80,
        supplier_code: 'PAR-004',
        dosage: '500mg',
        manufacturer: 'GSK',
        route_of_administration: 'Oral',
        expiry_date: '2025-12-31',
        manufacturing_date: '2024-01-15',
        batch_number: 'TEST-LOW-002',
        status: 'active'
      },

      // EXPIRING PRODUCTS
      {
        name: 'Antibiotic Syrup - Expiring Soon',
        drug_name: 'Amoxicillin',
        description: 'Antibiotic treatment - EXPIRING SOON',
        category_id: pharmaCategoryId,
        unit_of_measure: 'bottles',
        unit_price: 35.00,
        quantity: 50,
        low_stock_threshold: 20,
        reorder_quantity: 60,
        supplier_code: 'ANT-006',
        dosage: '250mg/5ml',
        manufacturer: 'Pfizer',
        route_of_administration: 'Oral',
        expiry_date: '2025-08-15', // EXPIRING SOON
        manufacturing_date: '2024-01-15',
        batch_number: 'TEST-EXP-001',
        status: 'active'
      },
      {
        name: 'Cough Medicine - Near Expiry',
        drug_name: 'Dextromethorphan',
        description: 'Cough suppressant - NEAR EXPIRY',
        category_id: pharmaCategoryId,
        unit_of_measure: 'bottles',
        unit_price: 18.75,
        quantity: 30,
        low_stock_threshold: 25,
        reorder_quantity: 70,
        supplier_code: 'COU-007',
        dosage: '15mg/5ml',
        manufacturer: 'Johnson & Johnson',
        route_of_administration: 'Oral',
        expiry_date: '2025-08-20', // EXPIRING SOON
        manufacturing_date: '2024-02-20',
        batch_number: 'TEST-EXP-002',
        status: 'active'
      },

      // ALREADY EXPIRED PRODUCTS
      {
        name: 'Insulin Vials - EXPIRED',
        drug_name: 'Human Insulin',
        description: 'Diabetes medication - EXPIRED',
        category_id: pharmaCategoryId,
        unit_of_measure: 'vials',
        unit_price: 85.00,
        quantity: 15,
        low_stock_threshold: 20,
        reorder_quantity: 50,
        supplier_code: 'INS-008',
        dosage: '100 IU/ml',
        manufacturer: 'Novo Nordisk',
        route_of_administration: 'Injection',
        expiry_date: '2024-05-15', // EXPIRED
        manufacturing_date: '2023-05-15',
        batch_number: 'TEST-EXP-003',
        status: 'active'
      }
    ];

    // Insert test products
    for (const product of testProducts) {
      try {
        const result = await client.query(`
          INSERT INTO products (
            name, drug_name, description, category_id, unit_of_measure, unit_price, 
            quantity, low_stock_threshold, reorder_quantity, supplier_code, dosage, 
            manufacturer, route_of_administration, expiry_date, manufacturing_date, 
            batch_number, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
          ) ON CONFLICT (name) DO UPDATE SET
            quantity = $7,
            low_stock_threshold = $8,
            expiry_date = $14,
            updated_at = NOW()
          RETURNING id, name, quantity, low_stock_threshold, expiry_date
        `, [
          product.name, product.drug_name, product.description, product.category_id,
          product.unit_of_measure, product.unit_price, product.quantity,
          product.low_stock_threshold, product.reorder_quantity, product.supplier_code,
          product.dosage, product.manufacturer, product.route_of_administration,
          product.expiry_date, product.manufacturing_date, product.batch_number, product.status
        ]);

        const addedProduct = result.rows[0];
        console.log(`✓ Added: ${addedProduct.name} (Stock: ${addedProduct.quantity}, Threshold: ${addedProduct.low_stock_threshold}, Expiry: ${addedProduct.expiry_date})`);
      } catch (err) {
        console.error(`Failed to add ${product.name}:`, err.message);
      }
    }

    // Verify the results
    console.log('\n=== VERIFICATION ===');

    const outOfStockResult = await client.query('SELECT name, quantity FROM products WHERE quantity = 0 AND status = $1', ['active']);
    console.log(`Out of stock products: ${outOfStockResult.rows.length}`);
    outOfStockResult.rows.forEach(p => console.log(`  - ${p.name}: ${p.quantity} units`));

    const lowStockResult = await client.query('SELECT name, quantity, low_stock_threshold FROM products WHERE quantity > 0 AND quantity <= low_stock_threshold AND status = $1', ['active']);
    console.log(`\nLow stock products: ${lowStockResult.rows.length}`);
    lowStockResult.rows.forEach(p => console.log(`  - ${p.name}: ${p.quantity}/${p.low_stock_threshold} units`));

    const expiringResult = await client.query("SELECT name, expiry_date FROM products WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date IS NOT NULL AND status = $1 ORDER BY expiry_date", ['active']);
    console.log(`\nExpiring products (within 30 days): ${expiringResult.rows.length}`);
    expiringResult.rows.forEach(p => console.log(`  - ${p.name}: expires ${p.expiry_date}`));

    const expiredResult = await client.query("SELECT name, expiry_date FROM products WHERE expiry_date < CURRENT_DATE AND expiry_date IS NOT NULL AND status = $1", ['active']);
    console.log(`\nExpired products: ${expiredResult.rows.length}`);
    expiredResult.rows.forEach(p => console.log(`  - ${p.name}: expired ${p.expiry_date}`));

    console.log('\n✅ Inventory test products added successfully!');
    console.log('Dashboard should now show multiple items in each alert category.');

  } catch (error) {
    console.error('Error adding inventory test products:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
addInventoryTestProducts().catch(console.error);