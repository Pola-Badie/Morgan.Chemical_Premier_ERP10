import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  ,
});

// Realistic pharmaceutical purchase orders data
const purchaseOrdersData = [
  {
    poNumber: 'PO-2025-001',
    supplierId: 1,
    userId: 1,
    orderDate: '2025-01-15',
    expectedDeliveryDate: '2025-01-25',
    status: 'pending',
    totalAmount: 15750.00,
    notes: 'Urgent order for Q1 production requirements',
    items: [
      { productId: 1, quantity: 500, unitPrice: 12.50, total: 6250.00 },
      { productId: 2, quantity: 300, unitPrice: 18.75, total: 5625.00 },
      { productId: 3, quantity: 250, unitPrice: 15.50, total: 3875.00 }
    ]
  },
  {
    poNumber: 'PO-2025-002',
    supplierId: 1,
    userId: 1,
    orderDate: '2025-01-18',
    expectedDeliveryDate: '2025-02-02',
    status: 'sent',
    totalAmount: 22400.00,
    notes: 'Bulk order for antibiotics production line',
    items: [
      { productId: 4, quantity: 800, unitPrice: 22.00, total: 17600.00 },
      { productId: 5, quantity: 400, unitPrice: 12.00, total: 4800.00 }
    ]
  },
  {
    poNumber: 'PO-2025-003',
    supplierId: 1,
    userId: 1,
    orderDate: '2025-01-20',
    expectedDeliveryDate: '2025-02-05',
    status: 'received',
    totalAmount: 8950.00,
    notes: 'Emergency restocking of pain relief medications',
    items: [
      { productId: 6, quantity: 200, unitPrice: 28.50, total: 5700.00 },
      { productId: 7, quantity: 150, unitPrice: 21.67, total: 3250.00 }
    ]
  },
  {
    poNumber: 'PO-2025-004',
    supplierId: 1,
    userId: 1,
    orderDate: '2025-01-22',
    expectedDeliveryDate: '2025-02-08',
    status: 'pending',
    totalAmount: 18600.00,
    notes: 'Raw materials for vitamin supplements',
    items: [
      { productId: 8, quantity: 600, unitPrice: 16.00, total: 9600.00 },
      { productId: 9, quantity: 300, unitPrice: 30.00, total: 9000.00 }
    ]
  },
  {
    poNumber: 'PO-2025-005',
    supplierId: 1,
    userId: 1,
    orderDate: '2025-01-22',
    expectedDeliveryDate: '2025-02-10',
    status: 'draft',
    totalAmount: 31200.00,
    notes: 'Large order for cardiovascular medications',
    items: [
      { productId: 10, quantity: 400, unitPrice: 45.00, total: 18000.00 },
      { productId: 11, quantity: 350, unitPrice: 24.00, total: 8400.00 },
      { productId: 12, quantity: 200, unitPrice: 24.00, total: 4800.00 }
    ]
  },
  {
    poNumber: 'PO-2025-006',
    supplierId: 1,
    userId: 1,
    orderDate: '2025-01-23',
    expectedDeliveryDate: '2025-02-12',
    status: 'sent',
    totalAmount: 14750.00,
    notes: 'Specialized chemical compounds for research',
    items: [
      { productId: 13, quantity: 150, unitPrice: 65.00, total: 9750.00 },
      { productId: 14, quantity: 250, unitPrice: 20.00, total: 5000.00 }
    ]
  }
];

async function generatePurchaseOrders() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Creating purchase orders...');

    for (const po of purchaseOrdersData) {
      // Insert purchase order
      const orderResult = await client.query(`
        INSERT INTO purchase_orders (po_number, supplier_id, user_id, order_date, expected_delivery_date, status, total_amount, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        po.poNumber,
        po.supplierId,
        po.userId,
        po.orderDate,
        po.expectedDeliveryDate,
        po.status,
        po.totalAmount,
        po.notes
      ]);

      const orderId = orderResult.rows[0].id;
      console.log(`Created purchase order: ${po.poNumber} (ID: ${orderId})`);

      // Insert purchase order items
      for (const item of po.items) {
        await client.query(`
          INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, total, received_quantity)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          orderId,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.total,
          po.status === 'received' ? item.quantity : 0 // If received, mark as fully received
        ]);
      }
    }

    await client.query('COMMIT');
    console.log(`Successfully created ${purchaseOrdersData.length} purchase orders!`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating purchase orders:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
generatePurchaseOrders().catch(console.error);