
import { db } from "./db";
import { 
  accounts, 
  journalEntries, 
  journalLines, 
  sales, 
  expenses, 
  customers 
} from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { loadFinancialData } from "./financial-seed-data";

export async function syncAllData() {
  console.log("Starting complete data synchronization...");
  
  try {
    // Load financial data
    const financialData = loadFinancialData();
    
    // 1. Sync customer balances from invoices
    const customersResult = await db.select().from(customers);
    
    for (const customer of customersResult) {
      const customerInvoices = financialData.dueInvoices.filter(invoice => 
        invoice.client.toLowerCase().includes(customer.name.toLowerCase()) ||
        customer.name.toLowerCase().includes(invoice.client.toLowerCase())
      );
      
      const totalPurchases = customerInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      
      if (totalPurchases > 0) {
        await db
          .update(customers)
          .set({ totalPurchases: totalPurchases.toString() })
          .where(eq(customers.id, customer.id));
      }
    }
    
    // 2. Sync account balances from real transactions
    const accountsResult = await db.select().from(accounts);
    
    for (const account of accountsResult) {
      let newBalance = 0;
      
      // Calculate balance based on account type and real data
      switch (account.type) {
        case 'Revenue':
          newBalance = financialData.dueInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
          break;
        case 'Expense':
          newBalance = financialData.expenses.reduce((sum, expense) => sum + expense.amount, 0) +
                     financialData.purchases.reduce((sum, purchase) => sum + purchase.total, 0);
          break;
        case 'Asset':
          if (account.code === '1100') { // Cash
            newBalance = 50000; // Starting balance
          } else if (account.code === '1200') { // Accounts Receivable
            newBalance = financialData.dueInvoices.reduce((sum, invoice) => sum + invoice.balance, 0);
          }
          break;
        case 'Liability':
          if (account.code === '2100') { // Accounts Payable
            newBalance = financialData.purchases
              .filter(p => p.paidStatus !== 'Paid')
              .reduce((sum, purchase) => sum + purchase.total, 0);
          }
          break;
      }
      
      if (newBalance !== parseFloat(account.balance || '0')) {
        await db
          .update(accounts)
          .set({ balance: newBalance.toString() })
          .where(eq(accounts.id, account.id));
      }
    }
    
    // 3. Sync expense records
    const existingExpenses = await db.select().from(expenses);
    
    for (const expenseData of financialData.expenses.slice(0, 10)) {
      const exists = existingExpenses.find(e => e.description === expenseData.description);
      
      if (!exists) {
        await db.insert(expenses).values({
          description: expenseData.description,
          amount: expenseData.amount.toString(),
          category: expenseData.costCenter,
          date: expenseData.date,
          paymentMethod: expenseData.paymentMethod,
          userId: 1,
          status: 'approved'
        });
      }
    }
    
    // 4. Sync sales records from invoices
    const existingSales = await db.select().from(sales);
    
    for (const invoice of financialData.dueInvoices.slice(0, 10)) {
      const exists = existingSales.find(s => s.customerName === invoice.client);
      
      if (!exists) {
        // Find matching customer
        const customer = customersResult.find(c => 
          c.name.toLowerCase().includes(invoice.client.toLowerCase()) ||
          invoice.client.toLowerCase().includes(c.name.toLowerCase())
        );
        
        if (customer) {
          await db.insert(sales).values({
            customerId: customer.id,
            customerName: invoice.client,
            invoiceNumber: `INV-${Date.now()}`,
            date: invoice.invoiceDate,
            subtotal: invoice.subtotal.toString(),
            tax: invoice.vat.toString(),
            total: invoice.totalAmount.toString(),
            paymentStatus: invoice.status === 'Paid' ? 'paid' : 'pending',
            userId: 1
          });
        }
      }
    }
    
    console.log("Data synchronization completed successfully");
    return { success: true, message: "All data synchronized" };
    
  } catch (error) {
    console.error("Data synchronization error:", error);
    return { success: false, error: error.message };
  }
}

// Disable auto-sync to save memory - sync manually when needed
// setInterval(syncAllData, 5 * 60 * 1000);
