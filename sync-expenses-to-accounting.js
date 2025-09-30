import { db } from "./server/db.ts";
import { 
  expenses, 
  expenseCategories, 
  journalEntries, 
  journalEntryLines, 
  accounts 
} from "./shared/schema.ts";
import { eq } from "drizzle-orm";

async function syncExpensesToAccounting() {
  console.log("🔄 Starting expense-to-accounting synchronization...");

  try {
    // Get all expenses that don't have journal entries
    const allExpenses = await db
      .select()
      .from(expenses)
      .orderBy(expenses.id);

    console.log(`📊 Found ${allExpenses.length} expenses in database`);

    // Check how many already have journal entries
    const existingJournals = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.sourceType, 'expense'));

    console.log(`📋 Found ${existingJournals.length} existing expense journal entries`);

    // Get all expense categories
    const categories = await db.select().from(expenseCategories);
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });

    // Get expense account for journal entries
    const [expenseAccount] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.code, '6100')); // Office Expenses

    const [cashAccount] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.code, '1100')); // Cash

    if (!expenseAccount || !cashAccount) {
      console.error("❌ Required accounts not found (6100 - Office Expenses, 1100 - Cash)");
      return;
    }

    console.log(`✅ Found required accounts: Expense (${expenseAccount.name}), Cash (${cashAccount.name})`);

    // Process each expense
    let syncedCount = 0;
    for (const expense of allExpenses) {
      // Check if journal entry already exists
      const [existingJournal] = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.sourceType, 'expense'))
        .where(eq(journalEntries.sourceId, expense.id));

      if (existingJournal) {
        console.log(`⏭️  Expense ${expense.id} already has journal entry ${existingJournal.entryNumber}`);
        continue;
      }

      // Generate journal entry number
      const year = new Date(expense.date).getFullYear();
      const month = String(new Date(expense.date).getMonth() + 1).padStart(2, '0');
      const sequence = String(syncedCount + 1).padStart(4, '0');
      const entryNumber = `JE-${year}${month}-${sequence}`;

      // Get category name
      const categoryName = categoryMap[expense.categoryId] || 'Other';

      // Create journal entry
      const journalEntry = {
        entryNumber,
        date: expense.date,
        description: expense.description,
        reference: 'Expense Entry',
        type: 'expense',
        status: 'posted',
        createdBy: expense.userId || 1,
        totalDebit: expense.amount.toString(),
        totalCredit: expense.amount.toString(),
        sourceType: 'expense',
        sourceId: expense.id
      };

      const [insertedEntry] = await db
        .insert(journalEntries)
        .values(journalEntry)
        .returning();

      // Create journal entry lines
      const journalLines = [
        // Debit: Expense Account
        {
          journalEntryId: insertedEntry.id,
          accountId: expenseAccount.id,
          debit: expense.amount.toString(),
          credit: "0",
          description: `${categoryName} - ${expense.description}`
        },
        // Credit: Cash Account
        {
          journalEntryId: insertedEntry.id,
          accountId: cashAccount.id,
          debit: "0",
          credit: expense.amount.toString(),
          description: `Payment for ${expense.description}`
        }
      ];

      await db.insert(journalEntryLines).values(journalLines);

      console.log(`✅ Created journal entry ${entryNumber} for expense ${expense.id}: ${expense.description} (${expense.amount})`);
      syncedCount++;
    }

    console.log(`🎉 Successfully synced ${syncedCount} expenses to accounting system`);
    
    // Verify synchronization
    const finalJournalCount = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.sourceType, 'expense'));

    console.log(`📊 Final journal entry count: ${finalJournalCount.length}`);
    console.log(`📊 Total expenses count: ${allExpenses.length}`);
    console.log(`✅ Synchronization complete!`);

  } catch (error) {
    console.error("❌ Error syncing expenses:", error);
  } finally {
    process.exit(0);
  }
}

syncExpensesToAccounting();