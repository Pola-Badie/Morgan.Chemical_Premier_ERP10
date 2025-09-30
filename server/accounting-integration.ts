import { db } from "./db";
import { 
  accounts, 
  journalEntries, 
  journalEntryLines, 
  sales, 
  expenses,
  insertJournalEntrySchema,
  insertJournalLineSchema 
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Account codes for automatic journal entries
export const ACCOUNT_CODES = {
  CASH: '1100',
  ACCOUNTS_RECEIVABLE: '1200', 
  INVENTORY: '1300',
  ACCOUNTS_PAYABLE: '2100',
  TAX_PAYABLE: '2200',
  SALES_REVENUE: '4100',
  COST_OF_GOODS_SOLD: '5100',
  OFFICE_EXPENSES: '6100',
  UTILITIES: '6300'
};

// Get account ID by code
export async function getAccountIdByCode(code: string): Promise<number | null> {
  try {
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.code, code))
      .limit(1);

    return account?.id || null;
  } catch (error) {
    console.error(`Error finding account with code ${code}:`, error);
    return null;
  }
}

// Generate unique journal entry number
export async function generateJournalEntryNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Get count of existing journal entries for this month to generate next sequence
  const prefix = `JE-${year}${month}-`;
  
  try {
    const entries = await db
      .select({ entryNumber: journalEntries.entryNumber })
      .from(journalEntries)
      .where(sql`entry_number LIKE ${prefix + '%'}`);
    
    const count = entries.length;
    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}${sequence}`;
  } catch (error) {
    console.error('Error generating journal entry number:', error);
    // Fallback to timestamp-based unique number
    const timestamp = Date.now().toString().slice(-4);
    return `JE-${year}${month}-${timestamp}`;
  }
}

// Create journal entry for invoice
export async function createInvoiceJournalEntry(invoiceData: any, userId: number) {
  try {
    const entryNumber = await generateJournalEntryNumber();
    const receivableAccountId = await getAccountIdByCode(ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
    const revenueAccountId = await getAccountIdByCode(ACCOUNT_CODES.SALES_REVENUE);
    const taxAccountId = await getAccountIdByCode(ACCOUNT_CODES.TAX_PAYABLE);

    if (!receivableAccountId || !revenueAccountId) {
      throw new Error('Required accounting accounts not found');
    }

    // Create journal entry
    const journalEntry = {
      entryNumber,
      date: invoiceData.date || new Date().toISOString().split('T')[0],
      reference: `Invoice ${invoiceData.invoiceNumber}`,
      memo: `Sale to ${invoiceData.customerName}`,
      totalDebit: invoiceData.grandTotal.toString(),
      totalCredit: invoiceData.grandTotal.toString(),
      sourceType: 'invoice',
      sourceId: invoiceData.id,
      userId,
      status: 'posted'
    };

    const [insertedEntry] = await db
      .insert(journalEntries)
      .values(journalEntry)
      .returning();

    // Create journal lines
    const journalLinesData = [
      // Debit: Accounts Receivable
      {
        journalEntryId: insertedEntry.id,
        accountId: receivableAccountId,
        description: `Invoice ${invoiceData.invoiceNumber} - ${invoiceData.customerName}`,
        debit: invoiceData.grandTotal.toString(),
        credit: '0'
      },
      // Credit: Sales Revenue
      {
        journalEntryId: insertedEntry.id,
        accountId: revenueAccountId,
        description: `Sales revenue - Invoice ${invoiceData.invoiceNumber}`,
        debit: '0',
        credit: invoiceData.totalAmount.toString()
      }
    ];

    // Add tax line if applicable
    if (invoiceData.tax && invoiceData.tax > 0 && taxAccountId) {
      journalLinesData.push({
        journalEntryId: insertedEntry.id,
        accountId: taxAccountId,
        description: `Tax on Invoice ${invoiceData.invoiceNumber}`,
        debit: '0',
        credit: invoiceData.tax.toString()
      });
    }

    await db.insert(journalEntryLines).values(journalLinesData);

    return insertedEntry;
  } catch (error) {
    console.error('Error creating invoice journal entry:', error);
    throw error;
  }
}

// Create journal entry for customer payment
export async function createPaymentJournalEntry(paymentData: any, userId: number) {
  try {
    const entryNumber = await generateJournalEntryNumber();
    const cashAccountId = await getAccountIdByCode(ACCOUNT_CODES.CASH);
    const receivableAccountId = await getAccountIdByCode(ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);

    if (!cashAccountId || !receivableAccountId) {
      throw new Error('Required accounting accounts not found');
    }

    const journalEntry = {
      entryNumber,
      date: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      reference: paymentData.reference || `Payment ${paymentData.paymentNumber}`,
      memo: `Payment from ${paymentData.customerName}`,
      totalDebit: paymentData.amount.toString(),
      totalCredit: paymentData.amount.toString(),
      sourceType: 'payment',
      sourceId: paymentData.id,
      userId,
      status: 'posted'
    };

    const [insertedEntry] = await db
      .insert(journalEntries)
      .values(journalEntry)
      .returning();

    const journalLinesData = [
      // Debit: Cash
      {
        journalEntryId: insertedEntry.id,
        accountId: cashAccountId,
        description: `Payment received - ${paymentData.reference}`,
        debit: paymentData.amount.toString(),
        credit: '0'
      },
      // Credit: Accounts Receivable
      {
        journalEntryId: insertedEntry.id,
        accountId: receivableAccountId,
        description: `Payment against A/R - ${paymentData.customerName}`,
        debit: '0',
        credit: paymentData.amount.toString()
      }
    ];

    await db.insert(journalEntryLines).values(journalLinesData);

    return insertedEntry;
  } catch (error) {
    console.error('Error creating payment journal entry:', error);
    throw error;
  }
}

// Create journal entry for expense
export async function createExpenseJournalEntry(expenseData: any, userId: number) {
  try {
    const entryNumber = await generateJournalEntryNumber();
    const cashAccountId = await getAccountIdByCode(ACCOUNT_CODES.CASH);
    const expenseAccountId = await getExpenseAccountId(expenseData.category);

    if (!cashAccountId || !expenseAccountId) {
      throw new Error('Required accounting accounts not found');
    }

    const journalEntry = {
      entryNumber,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      reference: expenseData.vendor || 'General Expense',
      memo: expenseData.description,
      totalDebit: expenseData.amount.toString(),
      totalCredit: expenseData.amount.toString(),
      sourceType: 'expense',
      sourceId: expenseData.id,
      userId,
      status: 'posted'
    };

    const [insertedEntry] = await db
      .insert(journalEntries)
      .values(journalEntry)
      .returning();

    const journalLinesData = [
      // Debit: Expense Account
      {
        journalEntryId: insertedEntry.id,
        accountId: expenseAccountId,
        description: expenseData.description,
        debit: expenseData.amount.toString(),
        credit: '0'
      },
      // Credit: Cash
      {
        journalEntryId: insertedEntry.id,
        accountId: cashAccountId,
        description: `Payment for ${expenseData.description}`,
        debit: '0',
        credit: expenseData.amount.toString()
      }
    ];

    await db.insert(journalEntryLines).values(journalLinesData);

    return insertedEntry;
  } catch (error) {
    console.error('Error creating expense journal entry:', error);
    throw error;
  }
}

// Map expense categories to account codes
async function getExpenseAccountId(category: string): Promise<number | null> {
  const categoryMapping: { [key: string]: string } = {
    'Office Supplies': ACCOUNT_CODES.OFFICE_EXPENSES,
    'Utilities': ACCOUNT_CODES.UTILITIES,
    'Travel': ACCOUNT_CODES.OFFICE_EXPENSES,
    'Marketing': ACCOUNT_CODES.OFFICE_EXPENSES,
    'Equipment': ACCOUNT_CODES.OFFICE_EXPENSES,
    'Rent': ACCOUNT_CODES.OFFICE_EXPENSES,
    'Insurance': ACCOUNT_CODES.OFFICE_EXPENSES,
    'Professional Services': ACCOUNT_CODES.OFFICE_EXPENSES,
    'Other': ACCOUNT_CODES.OFFICE_EXPENSES
  };

  const accountCode = categoryMapping[category] || ACCOUNT_CODES.OFFICE_EXPENSES;
  return await getAccountIdByCode(accountCode);
}

// Generate financial summary for dashboard with optimized SQL queries
export async function generateFinancialSummary() {
  try {
    // Import the required tables
    const { sales, expenses } = await import("@shared/schema");
    
    // Use Promise.all to run all queries in parallel for better performance
    const [
      revenueResult,
      expensesResult, 
      outstandingResult,
      accountsResult,
      salesCount,
      expensesCount
    ] = await Promise.all([
      // Total revenue using SQL aggregation
      db.select({ total: sql<string>`COALESCE(SUM(CAST(grand_total AS DECIMAL)), 0)` }).from(sales),
      
      // Total expenses using SQL aggregation  
      db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` }).from(expenses),
      
      // Outstanding A/R using SQL aggregation
      db.select({ total: sql<string>`COALESCE(SUM(CAST(grand_total AS DECIMAL)), 0)` })
        .from(sales)
        .where(eq(sales.paymentStatus, 'pending')),
      
      // Account balances grouped by type using SQL aggregation
      db.select({ 
        type: accounts.type,
        total: sql<string>`COALESCE(SUM(CAST(balance AS DECIMAL)), 0)`
      })
        .from(accounts)
        .where(eq(accounts.isActive, true))
        .groupBy(accounts.type),
      
      // Sales count
      db.select({ count: sql<number>`COUNT(*)` }).from(sales),
      
      // Expenses count  
      db.select({ count: sql<number>`COUNT(*)` }).from(expenses)
    ]);

    const totalRevenue = parseFloat(revenueResult[0]?.total || '0');
    const totalExpenses = parseFloat(expensesResult[0]?.total || '0');
    const outstandingAR = parseFloat(outstandingResult[0]?.total || '0');
    const netProfit = totalRevenue - totalExpenses;

    // Process account balances from aggregated results
    let totalAssets = 0;
    let totalLiabilities = 0; 
    let totalEquity = 0;

    for (const accountGroup of accountsResult) {
      const balance = parseFloat(accountGroup.total || '0');
      switch (accountGroup.type) {
        case 'Asset':
          totalAssets += balance;
          break;
        case 'Liability':
          totalLiabilities += balance;
          break;
        case 'Equity':
          totalEquity += balance;
          break;
      }
    }

    console.log('Financial Summary Calculation:', {
      totalRevenue,
      totalExpenses,
      netProfit,
      outstandingAR,
      salesCount: salesCount[0]?.count || 0,
      expensesCount: expensesCount[0]?.count || 0
    });

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      outstandingAR,
      totalAssets,
      totalLiabilities,
      totalEquity,
      accountsReceivable: outstandingAR,
      netIncome: netProfit
    };
  } catch (error) {
    console.error('Error generating financial summary:', error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      outstandingAR: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      accountsReceivable: 0,
      netIncome: 0
    };
  }
}

// Update account balances after journal entry
export async function updateAccountBalances(journalEntryId: number) {
  try {
    // Get all journal lines for this entry
    const lines = await db
      .select()
      .from(journalEntryLines)
      .where(eq(journalEntryLines.journalEntryId, journalEntryId));

    // Update each account balance
    for (const line of lines) {
      const debitAmount = parseFloat(line.debit || '0');
      const creditAmount = parseFloat(line.credit || '0');
      const netChange = debitAmount - creditAmount;

      // Get current account balance
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, line.accountId));

      if (account) {
        const currentBalance = parseFloat(account.balance || '0');
        const newBalance = currentBalance + netChange;

        await db
          .update(accounts)
          .set({ balance: newBalance.toString() })
          .where(eq(accounts.id, line.accountId));
      }
    }
  } catch (error) {
    console.error('Error updating account balances:', error);
    throw error;
  }
}