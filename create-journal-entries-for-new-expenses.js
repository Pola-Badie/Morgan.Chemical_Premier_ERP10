import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

});

async function createJournalEntriesForNewExpenses() {
  console.log('🔄 Creating journal entries for new expenses (IDs 11-15)...');

  const client = await pool.connect();

  try {
    // Get the new expenses that don't have journal entries
    const newExpenses = await client.query(`
      SELECT e.id, e.amount, e.category, e.description, e.vendor, e.date
      FROM expenses e
      LEFT JOIN journal_entries j ON e.id = j.source_id AND j.source_type = 'expense'
      WHERE e.id >= 11 AND j.id IS NULL
      ORDER BY e.id
    `);

    console.log(`📊 Found ${newExpenses.rows.length} new expenses without journal entries`);

    if (newExpenses.rows.length === 0) {
      console.log('✅ All expenses already have journal entries');
      return;
    }

    // Get the next journal entry number
    const journalCountResult = await client.query(`
      SELECT COUNT(*) as count FROM journal_entries
    `);
    let journalCount = parseInt(journalCountResult.rows[0].count);

    // Create journal entries for each new expense
    for (const expense of newExpenses.rows) {
      journalCount++;

      // Create the journal entry
      const journalEntryResult = await client.query(`
        INSERT INTO journal_entries (
          entry_number, 
          date, 
          memo, 
          total_debit, 
          total_credit, 
          status, 
          source_type, 
          source_id, 
          reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        `JE-${String(journalCount).padStart(6, '0')}`,
        expense.date,
        expense.description,
        expense.amount,
        expense.amount,
        'posted',
        'expense',
        expense.id,
        'Expense Entry'
      ]);

      const journalEntryId = journalEntryResult.rows[0].id;

      // Create journal entry lines (debit expense account, credit cash account)
      await client.query(`
        INSERT INTO journal_entry_lines (
          journal_entry_id, 
          account_id, 
          debit, 
          credit, 
          description
        ) VALUES ($1, $2, $3, $4, $5), ($1, $6, $7, $8, $9)
      `, [
        journalEntryId,
        8, // Office Expenses account ID (6100)
        expense.amount,
        0,
        `${expense.category} - ${expense.description}`,
        2, // Bank Account ID (1100)
        0,
        expense.amount,
        `Payment for ${expense.category}`
      ]);

      console.log(`✅ Created journal entry JE-${String(journalCount).padStart(6, '0')} for expense ${expense.id}: ${expense.category} - EGP ${expense.amount}`);
    }

    // Verify the journal entries were created
    const verifyResult = await client.query(`
      SELECT j.id, j.entry_number, j.total_debit, j.total_credit, j.reference, j.source_id
      FROM journal_entries j
      WHERE j.source_type = 'expense' AND j.source_id >= 11
      ORDER BY j.source_id
    `);

    console.log(`\n📋 Created ${verifyResult.rows.length} journal entries for new expenses:`);
    verifyResult.rows.forEach(entry => {
      console.log(`  ${entry.entry_number}: Debit ${entry.total_debit}, Credit ${entry.total_credit} (Expense ${entry.source_id})`);
    });

    // Test API endpoint
    console.log('\n🔄 Testing API endpoints...');
    const apiResponse = await fetch('http://localhost:5000/api/accounting/journal-entries');
    const apiData = await apiResponse.json();
    const expenseJournalEntries = apiData.filter(entry => entry.sourceType === 'expense' && entry.sourceId >= 11);

    console.log(`📡 API returns ${expenseJournalEntries.length} journal entries for new expenses`);

    // Calculate totals
    const totalNewExpenseAmount = newExpenses.rows.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalJournalDebits = expenseJournalEntries.reduce((sum, entry) => sum + parseFloat(entry.totalDebit), 0);
    const totalJournalCredits = expenseJournalEntries.reduce((sum, entry) => sum + parseFloat(entry.totalCredit), 0);

    console.log('\n🧮 Financial verification:');
    console.log(`  New expenses total: EGP ${totalNewExpenseAmount.toFixed(2)}`);
    console.log(`  Journal debits total: EGP ${totalJournalDebits.toFixed(2)}`);
    console.log(`  Journal credits total: EGP ${totalJournalCredits.toFixed(2)}`);
    console.log(`  Balance check: ${totalJournalDebits === totalJournalCredits ? '✅ BALANCED' : '❌ UNBALANCED'}`);

    console.log('\n🎉 Journal entries created successfully! Expense-to-accounting sync is complete.');

  } catch (error) {
    console.error('❌ Error creating journal entries:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
createJournalEntriesForNewExpenses().catch(console.error);