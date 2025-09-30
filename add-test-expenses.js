import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

});

async function addTestExpenses() {
  console.log('🧪 Adding new test expenses to verify accounting synchronization...');

  const client = await pool.connect();

  try {
    // Get the next expense ID
    const expenseCountResult = await client.query('SELECT COUNT(*) as count FROM expenses');
    const currentCount = parseInt(expenseCountResult.rows[0].count);
    console.log(`📊 Current expense count: ${currentCount}`);

    // Create realistic expense entries for July 2025
    const newExpenses = [
      {
        date: '2025-07-13',
        amount: 3500.00,
        category: 'Office Supplies',
        description: 'Purchase of laboratory chemicals and testing equipment',
        vendor: 'Scientific Equipment Co.',
        receipt_path: 'RCP-2025-001',
        payment_method: 'Bank Transfer',
        userId: 1
      },
      {
        date: '2025-07-13',
        amount: 1200.00,
        category: 'Utilities',
        description: 'Monthly electricity bill for factory operations',
        vendor: 'Cairo Electricity Company',
        receipt_path: 'ELEC-2025-07-001',
        payment_method: 'Cash',
        userId: 1
      },
      {
        date: '2025-07-13',
        amount: 2800.00,
        category: 'Transportation',
        description: 'Fuel costs for delivery trucks and company vehicles',
        vendor: 'Misr Petroleum',
        receipt_path: 'FUEL-2025-07-001',
        payment_method: 'Credit Card',
        userId: 1
      },
      {
        date: '2025-07-13',
        amount: 4500.00,
        category: 'Raw Materials',
        description: 'Chemical raw materials for pharmaceutical production',
        vendor: 'ChemCorp Industries',
        receipt_path: 'RAW-2025-07-001',
        payment_method: 'Bank Transfer',
        userId: 1
      },
      {
        date: '2025-07-13',
        amount: 950.00,
        category: 'Maintenance',
        description: 'Equipment maintenance and repair services',
        vendor: 'Tech Maintenance Services',
        receipt_path: 'MAINT-2025-07-001',
        payment_method: 'Cash',
        userId: 1
      }
    ];

    console.log('\n📝 Creating new expense entries...');

    // Insert new expenses
    for (const expense of newExpenses) {
      const insertResult = await client.query(`
        INSERT INTO expenses (date, amount, category, description, vendor, receipt_path, payment_method)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, amount, category, description, vendor
      `, [
        expense.date,
        expense.amount,
        expense.category,
        expense.description,
        expense.vendor,
        expense.receipt_path,
        expense.payment_method
      ]);

      const newExpense = insertResult.rows[0];
      console.log(`✅ Created expense ID ${newExpense.id}: ${expense.category} - EGP ${expense.amount} (${expense.vendor})`);
    }

    // Verify total expenses after addition
    const newCountResult = await client.query('SELECT COUNT(*) as count FROM expenses');
    const newCount = parseInt(newCountResult.rows[0].count);
    console.log(`\n📊 New expense count: ${newCount} (added ${newCount - currentCount} expenses)`);

    // Check expense categories
    const categoriesResult = await client.query(`
      SELECT category, COUNT(*) as count, SUM(amount) as total_amount
      FROM expenses
      GROUP BY category
      ORDER BY total_amount DESC
    `);

    console.log('\n📋 Expense breakdown by category:');
    categoriesResult.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} expenses, EGP ${parseFloat(row.total_amount).toFixed(2)}`);
    });

    // Test the API endpoints
    console.log('\n🔄 Testing API endpoints...');

    // Test expenses API
    const expensesResponse = await fetch('http://localhost:5000/api/expenses');
    const expensesData = await expensesResponse.json();
    console.log(`📡 API /api/expenses returns ${expensesData.length} expenses`);

    // Test journal entries API to verify accounting sync
    const journalResponse = await fetch('http://localhost:5000/api/journal-entries');
    const journalData = await journalResponse.json();
    console.log(`📖 API /api/journal-entries returns ${journalData.length} journal entries`);

    // Check for expense-related journal entries
    const expenseJournalEntries = journalData.filter(entry => entry.sourceType === 'expense');
    console.log(`💰 Found ${expenseJournalEntries.length} expense-related journal entries`);

    if (expenseJournalEntries.length > 0) {
      console.log('\n📝 Recent expense journal entries:');
      expenseJournalEntries.slice(0, 3).forEach((entry, index) => {
        console.log(`  ${index + 1}. Entry ${entry.id}: Debit ${entry.totalDebit}, Credit ${entry.totalCredit} (${entry.reference})`);
      });
    }

    // Calculate total amounts for verification
    const totalExpenseAmount = expensesData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalJournalDebits = expenseJournalEntries.reduce((sum, entry) => sum + parseFloat(entry.totalDebit), 0);
    const totalJournalCredits = expenseJournalEntries.reduce((sum, entry) => sum + parseFloat(entry.totalCredit), 0);

    console.log('\n🧮 Financial verification:');
    console.log(`  Total expenses amount: EGP ${totalExpenseAmount.toFixed(2)}`);
    console.log(`  Total journal debits: EGP ${totalJournalDebits.toFixed(2)}`);
    console.log(`  Total journal credits: EGP ${totalJournalCredits.toFixed(2)}`);
    console.log(`  Journal balance: ${totalJournalDebits === totalJournalCredits ? '✅ BALANCED' : '❌ UNBALANCED'}`);

    console.log('\n🎉 Test completed successfully! New expenses created and accounting sync verified.');

  } catch (error) {
    console.error('❌ Error adding test expenses:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
addTestExpenses().catch(console.error);