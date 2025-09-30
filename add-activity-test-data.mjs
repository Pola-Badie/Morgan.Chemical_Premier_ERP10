import { db } from './server/db.js';
import { 
  auditLogs, 
  inventoryTransactions, 
  users, 
  products 
} from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function addActivityTestData() {
  try {
    console.log('Starting to add activity test data...');
    
    // Get existing admin user
    const [adminUser] = await db.select().from(users)
      .where(eq(users.email, 'maged.morgan@morganerp.com'))
      .limit(1);
    
    console.log('Found admin user:', adminUser?.name || 'Not found');
    
    // Get some products to work with
    const sampleProducts = await db.select().from(products).limit(5);
    console.log(`Found ${sampleProducts.length} products`);
    
    if (!adminUser || sampleProducts.length === 0) {
      console.log('Missing admin user or products. Exiting.');
      return;
    }
    
    // Add audit log entries (product updates)
    console.log('Adding audit log entries...');
    for (let i = 0; i < 3; i++) {
      const product = sampleProducts[i % sampleProducts.length];
      const oldQuantity = Math.max(10, parseInt(product.quantity) - (20 + i * 10));
      const newQuantity = parseInt(product.quantity);
      
      await db.insert(auditLogs).values({
        tableName: 'products',
        recordId: product.id,
        action: 'UPDATE',
        oldValues: { 
          quantity: oldQuantity.toString(), 
          sellingPrice: (parseFloat(product.sellingPrice) - 2).toString() 
        },
        newValues: { 
          quantity: product.quantity, 
          sellingPrice: product.sellingPrice 
        },
        changedBy: adminUser.id,
        changedAt: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000),
        ipAddress: '10.0.0.1',
        userAgent: 'Premier ERP System v1.0'
      });
      
      console.log(`✓ Added audit log for ${product.name} (quantity: ${oldQuantity} → ${newQuantity})`);
    }
    
    // Add inventory transactions
    console.log('Adding inventory transactions...');
    for (let i = 0; i < 5; i++) {
      const product = sampleProducts[i % sampleProducts.length];
      const transactionTypes = ['purchase', 'sale', 'adjustment', 'purchase', 'sale'];
      const transactionType = transactionTypes[i];
      
      let quantity, referenceType, notes;
      
      if (transactionType === 'purchase') {
        quantity = 100 + (i * 25);
        referenceType = 'purchase';
        notes = `Stock received from supplier - Purchase Order PO-2025-${1001 + i}`;
      } else if (transactionType === 'sale') {
        quantity = -(30 + (i * 15));
        referenceType = 'sale';
        notes = `Stock sold to customer - Invoice INV-${2001 + i}`;
      } else {
        quantity = i % 2 === 0 ? 20 : -10;
        referenceType = 'adjustment';
        notes = `Inventory adjustment - ${quantity > 0 ? 'Stock increase' : 'Stock decrease'}`;
      }
      
      await db.insert(inventoryTransactions).values({
        productId: product.id,
        transactionType: transactionType,
        quantity: quantity,
        referenceType: referenceType,
        referenceId: 1000 + i,
        notes: notes,
        date: new Date(Date.now() - i * 8 * 60 * 60 * 1000), // Spread over last few hours
        userId: adminUser.id
      });
      
      console.log(`✓ Added ${transactionType} transaction for ${product.name} (${quantity > 0 ? '+' : ''}${quantity} ${product.unitOfMeasure})`);
    }
    
    // Add a few more audit entries for product creation
    console.log('Adding product creation audit logs...');
    for (let i = 0; i < 2; i++) {
      const product = sampleProducts[i + 2];
      
      await db.insert(auditLogs).values({
        tableName: 'products',
        recordId: product.id,
        action: 'INSERT',
        oldValues: null,
        newValues: {
          name: product.name,
          quantity: product.quantity,
          sellingPrice: product.sellingPrice
        },
        changedBy: adminUser.id,
        changedAt: new Date(new Date(product.createdAt).getTime() + 60000), // 1 minute after creation
        ipAddress: '10.0.0.1',
        userAgent: 'Premier ERP System v1.0'
      });
      
      console.log(`✓ Added creation audit log for ${product.name}`);
    }
    
    console.log('\n🎉 Successfully added activity test data!');
    console.log('Data includes:');
    console.log('- 3 product update audit logs');
    console.log('- 5 inventory transactions (purchases, sales, adjustments)');
    console.log('- 2 product creation audit logs');
    console.log('\nYou can now view real activity data in the inventory product details dialog.');
    
  } catch (error) {
    console.error('❌ Error adding activity test data:', error);
  }
  
  process.exit(0);
}

addActivityTestData();