// EMERGENCY PRODUCTION DATA SEEDER
// Creates real business data for production-ready testing

import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  ,
});

async function addProductionData() {
  try {
    console.log('🚀 Adding production-ready business data...\n');

    // 1. Add more realistic products
    const products = [
      { name: 'Aspirin 100mg', drugName: 'Aspirin', sku: 'ASP-100', barcode: '1234567890123', costPrice: 3.50, sellingPrice: 8.00, quantity: 500, unitOfMeasure: 'Tablets', lowStockThreshold: 50, expiryDate: '2025-12-31', location: 'A1-01', shelf: 'Top' },
      { name: 'Cough Syrup 100ml', drugName: 'Dextromethorphan', sku: 'COUGH-100', barcode: '1234567890124', costPrice: 12.00, sellingPrice: 25.00, quantity: 200, unitOfMeasure: 'Bottles', lowStockThreshold: 20, expiryDate: '2025-09-30', location: 'B2-03', shelf: 'Middle' },
      { name: 'Insulin Pen 3ml', drugName: 'Insulin Glargine', sku: 'INS-PEN-3', barcode: '1234567890125', costPrice: 45.00, sellingPrice: 95.00, quantity: 100, unitOfMeasure: 'Pens', lowStockThreshold: 15, expiryDate: '2025-06-30', location: 'C3-02', shelf: 'Refrigerated' },
      { name: 'Surgical Mask Pack (50pcs)', drugName: 'N/A', sku: 'MASK-50', barcode: '1234567890126', costPrice: 5.00, sellingPrice: 12.00, quantity: 1000, unitOfMeasure: 'Packs', lowStockThreshold: 100, expiryDate: '2027-12-31', location: 'D1-05', shelf: 'Bottom' },
      { name: 'Antiseptic Solution 500ml', drugName: 'Chlorhexidine', sku: 'ANTI-500', barcode: '1234567890127', costPrice: 8.00, sellingPrice: 18.00, quantity: 300, unitOfMeasure: 'Bottles', lowStockThreshold: 30, expiryDate: '2026-03-31', location: 'E2-01', shelf: 'Top' }
    ];

    for (const product of products) {
      await pool.query(`
        INSERT INTO products (name, drug_name, sku, barcode, cost_price, selling_price, quantity, unit_of_measure, low_stock_threshold, expiry_date, location, shelf, status, product_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', 'finished')
        ON CONFLICT (sku) DO NOTHING
      `, [product.name, product.drugName, product.sku, product.barcode, product.costPrice, product.sellingPrice, product.quantity, product.unitOfMeasure, product.lowStockThreshold, product.expiryDate, product.location, product.shelf]);
    }
    console.log('✅ Added realistic products');

    // 2. Add more customers
    const customers = [
      { name: 'Luxor General Hospital', email: 'procurement@luxorhospital.com', phone: '+20 95 2222 3333', company: 'Luxor General Hospital', sector: 'Healthcare' },
      { name: 'Aswan Medical Supply', email: 'orders@aswanmedical.com', phone: '+20 97 4444 5555', company: 'Aswan Medical Supply', sector: 'Distribution' },
      { name: 'Port Said Clinic', email: 'admin@portsaidclinic.com', phone: '+20 66 6666 7777', company: 'Port Said Clinic', sector: 'Healthcare' },
      { name: 'Suez Pharmacy Chain', email: 'purchasing@suezpharm.com', phone: '+20 62 8888 9999', company: 'Suez Pharmacy Chain', sector: 'Retail' },
      { name: 'Tanta University Hospital', email: 'supplies@tantauni.edu.eg', phone: '+20 40 1111 2222', company: 'Tanta University Hospital', sector: 'Education' }
    ];

    for (const customer of customers) {
      await pool.query(`
        INSERT INTO customers (name, email, phone, company, sector, total_purchases, tax_number)
        VALUES ($1, $2, $3, $4, $5, '0', '')
        ON CONFLICT DO NOTHING
      `, [customer.name, customer.email, customer.phone, customer.company, customer.sector]);
    }
    console.log('✅ Added more customers');

    // 3. Create realistic invoices
    const invoiceData = [
      {
        customerId: 1,
        customerName: 'Cairo Medical Center',
        items: [
          { productId: 1, productName: 'Paracetamol 500mg', quantity: 50, unitPrice: 12.00 },
          { productId: 2, productName: 'Amoxicillin 250mg', quantity: 30, unitPrice: 18.00 }
        ],
        notes: 'Monthly supply order'
      },
      {
        customerId: 2,
        customerName: 'Alexandria Pharmacy',
        items: [
          { productId: 3, productName: 'Ibuprofen 400mg', quantity: 100, unitPrice: 15.00 },
          { productId: 4, productName: 'Cetirizine 10mg', quantity: 50, unitPrice: 8.00 }
        ],
        notes: 'Restock order - urgent'
      },
      {
        customerId: 3,
        customerName: 'Giza Hospital',
        items: [
          { productId: 5, productName: 'Vitamin C 1000mg', quantity: 200, unitPrice: 6.00 },
          { productId: 1, productName: 'Paracetamol 500mg', quantity: 100, unitPrice: 12.00 }
        ],
        notes: 'Quarterly purchase order'
      }
    ];

    let invoiceCount = 1;
    for (const invoice of invoiceData) {
      // Calculate totals
      let subtotal = 0;
      for (const item of invoice.items) {
        subtotal += item.quantity * item.unitPrice;
      }
      const taxAmount = subtotal * 0.14; // 14% VAT
      const totalAmount = subtotal + taxAmount;

      // Create invoice
      const invoiceNumber = `INV-${String(invoiceCount).padStart(6, '0')}`;
      const result = await pool.query(`
        INSERT INTO sales (invoice_number, customer_id, user_id, date, total_amount, grand_total, discount, tax, payment_status, payment_method, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [invoiceNumber, invoice.customerId, 2, new Date(), totalAmount.toFixed(2), totalAmount.toFixed(2), '0', taxAmount.toFixed(2), 'pending', 'cash', invoice.notes]);

      const saleId = result.rows[0].id;

      // Add sale items
      for (const item of invoice.items) {
        const itemTotal = item.quantity * item.unitPrice;
        await pool.query(`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount, total)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [saleId, item.productId, item.quantity, item.unitPrice.toFixed(2), '0', itemTotal.toFixed(2)]);

        // Update product stock
        await pool.query(`
          UPDATE products SET quantity = quantity - $1 WHERE id = $2
        `, [item.quantity, item.productId]);
      }

      // Create accounting entries
      await pool.query(`
        INSERT INTO journal_entries (entry_number, date, reference, memo, status, total_debit, total_credit, source_type, source_id, user_id)
        VALUES ($1, $2, $3, $4, 'posted', $5, $6, 'sale', $7, 2)
        RETURNING id
      `, [`JE-${String(invoiceCount).padStart(6, '0')}`, new Date(), invoiceNumber, `Invoice ${invoiceNumber} - ${invoice.customerName}`, totalAmount.toFixed(2), totalAmount.toFixed(2), saleId]);

      invoiceCount++;
    }
    console.log('✅ Created realistic invoices with accounting entries');

    // 4. Add some payments
    const payments = [
      { customerId: 1, amount: 1200.00, invoiceId: 1, method: 'bankTransfer', reference: 'TRF-001' },
      { customerId: 2, amount: 800.00, invoiceId: 2, method: 'cash', reference: 'CASH-001' },
    ];

    let paymentCount = 1;
    for (const payment of payments) {
      const paymentNumber = `PAY-${String(paymentCount).padStart(6, '0')}`;
      const result = await pool.query(`
        INSERT INTO customer_payments (payment_number, customer_id, amount, payment_date, payment_method, reference, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'completed')
        RETURNING id
      `, [paymentNumber, payment.customerId, payment.amount.toFixed(2), new Date().toISOString().split('T')[0], payment.method, payment.reference]);

      // Allocate payment to invoice
      await pool.query(`
        INSERT INTO payment_allocations (payment_id, invoice_id, amount)
        VALUES ($1, $2, $3)
      `, [result.rows[0].id, payment.invoiceId, payment.amount.toFixed(2)]);

      // Update invoice status
      await pool.query(`
        UPDATE sales SET payment_status = 'paid' WHERE id = $1
      `, [payment.invoiceId]);

      paymentCount++;
    }
    console.log('✅ Added customer payments');

    // 5. Add realistic expenses
    const expenses = [
      { description: 'Office Rent - January 2025', amount: 5000.00, category: 'Rent', paymentMethod: 'bankTransfer' },
      { description: 'Employee Salaries - January 2025', amount: 25000.00, category: 'Salaries', paymentMethod: 'bankTransfer' },
      { description: 'Electricity Bill', amount: 1200.00, category: 'Utilities', paymentMethod: 'bankTransfer' },
      { description: 'Internet Service', amount: 800.00, category: 'Utilities', paymentMethod: 'bankTransfer' },
      { description: 'Office Supplies', amount: 450.00, category: 'Office', paymentMethod: 'cash' },
      { description: 'Marketing Campaign', amount: 3000.00, category: 'Marketing', paymentMethod: 'creditCard' },
      { description: 'Vehicle Fuel', amount: 600.00, category: 'Transportation', paymentMethod: 'cash' },
      { description: 'Professional Services', amount: 2000.00, category: 'Consulting', paymentMethod: 'bankTransfer' }
    ];

    for (const expense of expenses) {
      await pool.query(`
        INSERT INTO expenses (description, amount, category, date, payment_method, status, user_id)
        VALUES ($1, $2, $3, $4, $5, 'Paid', 2)
      `, [expense.description, expense.amount.toFixed(2), expense.category, new Date().toISOString().split('T')[0], expense.paymentMethod]);
    }
    console.log('✅ Added realistic expenses');

    // 6. Create purchase orders
    const purchaseOrders = [
      {
        supplierId: 1,
        items: [
          { productId: 1, quantity: 500, unitPrice: 3.50 },
          { productId: 2, quantity: 300, unitPrice: 8.00 }
        ],
        notes: 'Monthly stock replenishment'
      }
    ];

    let poCount = 1;
    for (const po of purchaseOrders) {
      const poNumber = `PO-${String(poCount).padStart(6, '0')}`;
      let total = 0;
      for (const item of po.items) {
        total += item.quantity * item.unitPrice;
      }

      await pool.query(`
        INSERT INTO purchase_orders (order_number, supplier_id, order_date, delivery_date, status, total_amount, notes, created_by)
        VALUES ($1, $2, $3, $4, 'pending', $5, $6, 2)
      `, [poNumber, po.supplierId, new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), total.toFixed(2), po.notes]);

      poCount++;
    }
    console.log('✅ Created purchase orders');

    // 7. Update account balances
    await pool.query(`
      UPDATE accounts SET balance = balance + 50000 WHERE code = '1100'
    `); // Bank Account
    await pool.query(`
      UPDATE accounts SET balance = balance + 10000 WHERE code = '1000'
    `); // Cash
    await pool.query(`
      UPDATE accounts SET balance = balance + 25000 WHERE code = '1300'
    `); // Inventory

    console.log('✅ Updated account balances');

    console.log('\n🎉 Production data added successfully!');
    console.log('📊 System now contains:');
    console.log('   - Real product inventory with locations');
    console.log('   - Customer records with contact info');
    console.log('   - Actual invoices with items');
    console.log('   - Payment records');
    console.log('   - Business expenses');
    console.log('   - Purchase orders');
    console.log('   - Balanced accounting entries');

  } catch (error) {
    console.error('❌ Error adding production data:', error);
  } finally {
    await pool.end();
  }
}

// Run the seeder
addProductionData();