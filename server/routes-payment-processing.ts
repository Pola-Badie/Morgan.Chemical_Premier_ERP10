import { Express, Request, Response } from "express";
import { db } from "./db";
import {
  customerPayments,
  paymentAllocations,
  sales,
  customers,
  journalEntries,
  journalEntryLines,
  accounts,
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export function registerPaymentProcessingRoutes(app: Express) {
  // Process customer payment
  app.post("/api/payments/process", async (req: Request, res: Response) => {
    try {
      const { customerId, amount, paymentMethod, invoiceIds, reference, notes } = req.body;

      // Validate input
      if (!customerId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment data" });
      }

      // Generate payment number
      const paymentCount = await db.select({ count: sql`count(*)::int` }).from(customerPayments);
      const paymentNumber = `PAY-${String(paymentCount[0].count + 1).padStart(6, '0')}`;

      // Create payment record
      const [payment] = await db.insert(customerPayments).values({
        paymentNumber,
        customerId,
        amount: amount.toFixed(2),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'cash',
        reference: reference || '',
        notes: notes || '',
        status: 'completed'
      }).returning();

      // Allocate payment to invoices
      if (invoiceIds && invoiceIds.length > 0) {
        let remainingAmount = parseFloat(amount);
        
        for (const invoiceId of invoiceIds) {
          if (remainingAmount <= 0) break;
          
          // Get invoice details
          const [invoice] = await db.select().from(sales).where(eq(sales.id, invoiceId));
          if (!invoice) continue;
          
          const invoiceAmount = parseFloat(invoice.totalAmount);
          const allocationAmount = Math.min(remainingAmount, invoiceAmount);
          
          // Create payment allocation
          await db.insert(paymentAllocations).values({
            paymentId: payment.id,
            invoiceId: invoice.id,
            amount: allocationAmount.toFixed(2)
          });
          
          // Update invoice payment status
          const newStatus = allocationAmount >= invoiceAmount ? 'paid' : 'partial';
          await db.update(sales)
            .set({ paymentStatus: newStatus })
            .where(eq(sales.id, invoice.id));
          
          remainingAmount -= allocationAmount;
        }
      }

      // Create accounting entries
      await createPaymentAccountingEntries(payment, customerId, amount);

      res.status(201).json({
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        message: "Payment processed successfully",
        amount: amount
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Get all payments
  app.get("/api/payments", async (req: Request, res: Response) => {
    try {
      const payments = await db
        .select({
          id: customerPayments.id,
          paymentNumber: customerPayments.paymentNumber,
          customerId: customerPayments.customerId,
          customerName: customers.name,
          amount: customerPayments.amount,
          paymentDate: customerPayments.paymentDate,
          paymentMethod: customerPayments.paymentMethod,
          reference: customerPayments.reference,
          status: customerPayments.status
        })
        .from(customerPayments)
        .leftJoin(customers, eq(customerPayments.customerId, customers.id))
        .orderBy(desc(customerPayments.paymentDate));

      res.json(payments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Get payment allocations for an invoice
  app.get("/api/payments/invoice/:invoiceId", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      
      const allocations = await db
        .select({
          paymentId: paymentAllocations.paymentId,
          paymentNumber: customerPayments.paymentNumber,
          amount: paymentAllocations.amount,
          paymentDate: customerPayments.paymentDate,
          paymentMethod: customerPayments.paymentMethod
        })
        .from(paymentAllocations)
        .innerJoin(customerPayments, eq(paymentAllocations.paymentId, customerPayments.id))
        .where(eq(paymentAllocations.invoiceId, invoiceId));

      res.json(allocations);
    } catch (error) {
      console.error("Get payment allocations error:", error);
      res.status(500).json({ message: "Failed to fetch payment allocations" });
    }
  });

  // Get customer payment history
  app.get("/api/payments/customer/:customerId", async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      
      const payments = await db
        .select()
        .from(customerPayments)
        .where(eq(customerPayments.customerId, customerId))
        .orderBy(desc(customerPayments.paymentDate));

      res.json(payments);
    } catch (error) {
      console.error("Get customer payments error:", error);
      res.status(500).json({ message: "Failed to fetch customer payments" });
    }
  });
}

// Helper function to create accounting entries for payments
async function createPaymentAccountingEntries(payment: any, customerId: number, amount: number) {
  try {
    // Get customer name
    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
    const customerName = customer ? customer.name : 'Customer';

    // Create journal entry
    const [journalEntry] = await db.insert(journalEntries).values({
      date: payment.paymentDate,
      description: `Payment ${payment.paymentNumber} from ${customerName}`,
      reference: payment.paymentNumber,
      type: 'payment',
      status: 'posted',
      createdBy: 2,
      totalDebit: amount.toFixed(2),
      totalCredit: amount.toFixed(2)
    }).returning();

    // Debit Cash/Bank
    const cashAccountId = payment.paymentMethod === 'cash' ? 10 : 11; // Cash or Bank Account
    await db.insert(journalEntryLines).values({
      journalEntryId: journalEntry.id,
      accountId: cashAccountId,
      debit: amount.toFixed(2),
      credit: "0",
      description: `Payment received - ${payment.paymentNumber}`
    });

    // Credit Accounts Receivable
    await db.insert(journalEntryLines).values({
      journalEntryId: journalEntry.id,
      accountId: 12, // Accounts Receivable
      debit: "0",
      credit: amount.toFixed(2),
      description: `Payment from ${customerName}`
    });

    // Update account balances
    await updateAccountBalances(cashAccountId, amount, 'debit');
    await updateAccountBalances(12, amount, 'credit');
  } catch (error) {
    console.error("Error creating payment accounting entries:", error);
  }
}

// Helper function to update account balances
async function updateAccountBalances(accountId: number, amount: number, type: 'debit' | 'credit') {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (!account) return;

  const currentBalance = parseFloat(account.balance);
  let newBalance = currentBalance;

  // Assets and expenses increase with debits, decrease with credits
  // Liabilities, equity, and income increase with credits, decrease with debits
  if (account.type === 'Asset' || account.type === 'Expense') {
    newBalance = type === 'debit' ? currentBalance + amount : currentBalance - amount;
  } else {
    newBalance = type === 'credit' ? currentBalance + amount : currentBalance - amount;
  }

  await db.update(accounts)
    .set({ balance: newBalance.toFixed(2) })
    .where(eq(accounts.id, accountId));
}