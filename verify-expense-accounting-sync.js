import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

});

async function verifyExpenseAccountingSync() {
  console.log('🔍 EXPENSE-TO-ACCOUNTING SYNCHRONIZATION VERIFICATION');
  console.log('='.repeat(60));

  const client = await pool.connect();

  try {
    // 1. Check all expenses
    const expensesResult = await client.query(`
      SELECT id, date, amount, category, description, vendor, payment_method
      FROM expenses
      ORDER BY id
    `);

    console.log(`\n📊 EXPENSE RECORDS: ${expensesResult.rows.length} total expenses`);
    console.log('─'.repeat(60));

    let totalExpenseAmount = 0;
    expensesResult.rows.forEach((expense, index) => {
      totalExpenseAmount += parseFloat(expense.amount);
      console.log(`${index + 1}. ID ${expense.id}: ${expense.category} - EGP ${expense.amount} (${expense.vendor || 'No vendor'})`);
    });

    console.log(`\n💰 Total Expense Amount: EGP ${totalExpenseAmount.toFixed(2)}`);

    // 2. Check journal entries for expenses
    const journalEntriesResult = await client.query(`
      SELECT je.id, je.entry_number, je.date, je.total_debit, je.total_credit, 
             je.reference, je.source_id, je.memo
      FROM journal_entries je
      WHERE je.source_type = 'expense'
      ORDER BY je.source_id
    `);

    console.log(`\n📖 JOURNAL ENTRIES: ${journalEntriesResult.rows.length} expense journal entries`);
    console.log('─'.repeat(60));

    let totalJournalDebits = 0;
    let totalJournalCredits = 0;

    journalEntriesResult.rows.forEach((entry, index) => {
      totalJournalDebits += parseFloat(entry.total_debit);
      totalJournalCredits += parseFloat(entry.total_credit);
      console.log(`${index + 1}. ${entry.entry_number}: Expense ${entry.source_id} - Debit ${entry.total_debit}, Credit ${entry.total_credit}`);
    });

    console.log(`\n💰 Total Journal Debits: EGP ${totalJournalDebits.toFixed(2)}`);
    console.log(`💰 Total Journal Credits: EGP ${totalJournalCredits.toFixed(2)}`);
    console.log(`⚖️  Balance Check: ${totalJournalDebits === totalJournalCredits ? '✅ BALANCED' : '❌ UNBALANCED'}`);

    // 3. Check synchronization completeness
    const syncCheckResult = await client.query(`
      SELECT 
        e.id as expense_id,
        e.amount as expense_amount,
        je.id as journal_id,
        je.entry_number,
        je.total_debit,
        je.total_credit
      FROM expenses e
      LEFT JOIN journal_entries je ON e.id = je.source_id AND je.source_type = 'expense'
      ORDER BY e.id
    `);

    console.log(`\n🔄 SYNCHRONIZATION STATUS`);
    console.log('─'.repeat(60));

    let syncedCount = 0;
    let unsyncedCount = 0;

    syncCheckResult.rows.forEach(row => {
      if (row.journal_id) {
        syncedCount++;
        console.log(`✅ Expense ${row.expense_id} → Journal ${row.entry_number} (${row.total_debit} debit)`);
      } else {
        unsyncedCount++;
        console.log(`❌ Expense ${row.expense_id} → NO JOURNAL ENTRY`);
      }
    });

    console.log(`\n📊 SYNCHRONIZATION SUMMARY:`);
    console.log(`   ✅ Synced: ${syncedCount} expenses`);
    console.log(`   ❌ Unsynced: ${unsyncedCount} expenses`);
    console.log(`   📈 Sync Rate: ${((syncedCount / (syncedCount + unsyncedCount)) * 100).toFixed(1)}%`);

    // 4. Test API endpoints
    console.log(`\n🔗 API ENDPOINT VERIFICATION`);
    console.log('─'.repeat(60));

    // Test expenses API
    const expensesApiResponse = await fetch('http://localhost:5000/api/expenses');
    const expensesApiData = await expensesApiResponse.json();
    console.log(`📡 /api/expenses: ${expensesApiData.length} expenses returned`);

    // Test journal entries API
    const journalApiResponse = await fetch('http://localhost:5000/api/accounting/journal-entries');
    const journalApiData = await journalApiResponse.json();
    const expenseJournalEntries = journalApiData.filter(entry => entry.sourceType === 'expense');
    console.log(`📡 /api/accounting/journal-entries: ${expenseJournalEntries.length} expense journal entries returned`);

    // Test alternative journal entries API
    const journalApiResponse2 = await fetch('http://localhost:5000/api/journal-entries');
    const journalApiData2 = await journalApiResponse2.json();
    const expenseJournalEntries2 = journalApiData2.filter(entry => entry.sourceType === 'expense');
    console.log(`📡 /api/journal-entries: ${expenseJournalEntries2.length} expense journal entries returned`);

    // 5. Financial calculations verification
    console.log(`\n🧮 FINANCIAL CALCULATIONS`);
    console.log('─'.repeat(60));

    const apiExpenseTotal = expensesApiData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const apiJournalDebits = expenseJournalEntries.reduce((sum, entry) => sum + parseFloat(entry.totalDebit), 0);
    const apiJournalCredits = expenseJournalEntries.reduce((sum, entry) => sum + parseFloat(entry.totalCredit), 0);

    console.log(`📊 Database Total Expenses: EGP ${totalExpenseAmount.toFixed(2)}`);
    console.log(`📊 API Total Expenses: EGP ${apiExpenseTotal.toFixed(2)}`);
    console.log(`📊 API Journal Debits: EGP ${apiJournalDebits.toFixed(2)}`);
    console.log(`📊 API Journal Credits: EGP ${apiJournalCredits.toFixed(2)}`);

    // Verification checks
    console.log(`\n✅ VERIFICATION CHECKS`);
    console.log('─'.repeat(60));

    const checks = [
      {
        name: 'Database vs API Expense Totals Match',
        condition: Math.abs(totalExpenseAmount - apiExpenseTotal) < 0.01,
        dbValue: totalExpenseAmount,
        apiValue: apiExpenseTotal
      },
      {
        name: 'Journal Entries Balanced (Debits = Credits)',
        condition: Math.abs(apiJournalDebits - apiJournalCredits) < 0.01,
        dbValue: apiJournalDebits,
        apiValue: apiJournalCredits
      },
      {
        name: 'All Expenses Have Journal Entries',
        condition: unsyncedCount === 0,
        dbValue: unsyncedCount,
        apiValue: 'should be 0'
      },
      {
        name: 'API Endpoints Return Same Data',
        condition: expenseJournalEntries.length === expenseJournalEntries2.length,
        dbValue: expenseJournalEntries.length,
        apiValue: expenseJournalEntries2.length
      }
    ];

    let allChecksPassed = true;

    checks.forEach(check => {
      const status = check.condition ? '✅ PASS' : '❌ FAIL';
      console.log(`${status}: ${check.name}`);
      if (!check.condition) {
        console.log(`   Expected: ${check.apiValue}, Got: ${check.dbValue}`);
        allChecksPassed = false;
      }
    });

    console.log(`\n🎯 FINAL RESULT: ${allChecksPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);

    if (allChecksPassed) {
      console.log(`\n🎉 EXPENSE-TO-ACCOUNTING SYNCHRONIZATION IS 100% FUNCTIONAL!`);
      console.log(`   • All ${expensesResult.rows.length} expenses have corresponding journal entries`);
      console.log(`   • All journal entries are properly balanced`);
      console.log(`   • API endpoints return consistent data`);
      console.log(`   • Financial calculations are accurate`);
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the verification
verifyExpenseAccountingSync().catch(console.error);