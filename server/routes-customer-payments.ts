import { Express, Request, Response } from "express";
import { faker } from "@faker-js/faker";

// Define types for payments and allocations
interface PaymentAllocation {
  id: number;
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
}

interface Payment {
  id: number;
  paymentNumber: string;
  customerId: number;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes: string;
  status: string;
  allocations: PaymentAllocation[];
}

// Generate sample payments data
export function generatePayments(count = 15) {
  try {
    const payments = [];
    
    for (let i = 0; i < count; i++) {
      // Generate basic payment data
      const payment: Payment = {
        id: i + 1,
        paymentNumber: `PMT-${String(2025000 + i).padStart(6, '0')}`,
        customerId: faker.number.int({ min: 1, max: 10 }),
        customerName: faker.company.name(),
        paymentDate: faker.date.recent({ days: 30 }).toISOString(),
        amount: faker.number.int({ min: 1000, max: 10000 }) / 100,
        paymentMethod: faker.helpers.arrayElement(['cash', 'creditCard', 'bankTransfer', 'cheque']),
        reference: faker.string.alphanumeric(8),
        notes: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['completed', 'pending', 'failed']),
        allocations: []
      };
      
      // Generate 1-3 allocations for this payment
      const allocationCount = faker.number.int({ min: 1, max: 3 });
      let remainingAmount = payment.amount;
      
      const allocationItems: PaymentAllocation[] = [];
      for (let j = 0; j < allocationCount; j++) {
        const isLast = j === allocationCount - 1;
        let allocationAmount;
        
        if (isLast) {
          allocationAmount = remainingAmount;
        } else {
          const minAmount = Math.min(remainingAmount * 25, 100);
          const maxAmount = Math.min(remainingAmount * 75, remainingAmount * 100);
          allocationAmount = faker.number.int({ 
            min: minAmount, 
            max: maxAmount 
          }) / 100;
          remainingAmount -= allocationAmount;
        }
        
        const allocation: PaymentAllocation = {
          id: i * 10 + j + 1,
          paymentId: payment.id,
          invoiceId: faker.number.int({ min: 100, max: 500 }),
          invoiceNumber: `INV-${String(2025100 + j + i).padStart(6, '0')}`,
          amount: allocationAmount
        };
        
        allocationItems.push(allocation);
      }
      
      payment.allocations = allocationItems;
      payments.push(payment);
    }
    
    return payments;
  } catch (error) {
    console.error("Error generating payments:", error);
    return [];
  }
}

// Generate pending invoices
export function generatePendingInvoices(count = 10) {
  const pendingInvoices = [];
  
  for (let i = 0; i < count; i++) {
    const total = faker.number.int({ min: 2000, max: 10000 }) / 100;
    const amountPaid = faker.helpers.maybe(
      () => faker.number.int({ min: 0, max: total * 0.8 * 100 }) / 100,
      { probability: 0.6 }
    ) || 0;
    const amountDue = total - amountPaid;
    
    const invoice = {
      id: i + 100,
      invoiceNumber: `INV-${String(2025100 + i).padStart(6, '0')}`,
      customerId: faker.number.int({ min: 1, max: 10 }),
      customerName: faker.company.name(),
      date: faker.date.recent({ days: 30 }).toISOString(),
      dueDate: faker.date.soon({ days: 30 }).toISOString(),
      total,
      amountPaid,
      amountDue,
      status: amountPaid > 0 ? 'partial' : faker.helpers.arrayElement(['unpaid', 'overdue'])
    };
    
    pendingInvoices.push(invoice);
  }
  
  return pendingInvoices;
}

export function registerCustomerPaymentRoutes(app: Express) {
  // Get all customer payments
  app.get("/api/accounting/payments", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      let payments = generatePayments();
      
      // Filter by customer ID if provided
      if (customerId) {
        payments = payments.filter(payment => 
          payment.customerId === parseInt(customerId as string)
        );
      }
      
      // Sort by date, newest first
      payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      
      res.json(payments);
    } catch (error) {
      console.error("Error generating payments:", error);
      res.status(500).json({ error: "Failed to generate payments" });
    }
  });
  
  // Get pending invoices for payments
  app.get("/api/accounting/invoices/pending", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      let pendingInvoices = generatePendingInvoices();
      
      // Filter by customer ID if provided
      if (customerId) {
        pendingInvoices = pendingInvoices.filter(invoice => 
          invoice.customerId === parseInt(customerId as string)
        );
      }
      
      // Sort by due date, most urgent first
      pendingInvoices.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
      res.json(pendingInvoices);
    } catch (error) {
      console.error("Error generating pending invoices:", error);
      res.status(500).json({ error: "Failed to generate pending invoices" });
    }
  });
  
  // Create a new payment with automatic journal entry
  app.post("/api/accounting/payments", async (req: Request, res: Response) => {
    try {
      const { customerId, amount, paymentMethod, reference, notes, allocations } = req.body;
      
      // Generate a payment number
      const paymentNumber = `PMT-${faker.string.alphanumeric(6).toUpperCase()}`;
      
      // Create the payment object
      const payment = {
        id: faker.string.uuid(),
        paymentNumber,
        customerId,
        customerName: `Customer ${customerId}`, // In a real app, this would fetch the customer name
        paymentDate: new Date().toISOString(),
        amount,
        paymentMethod,
        reference,
        notes,
        status: 'completed',
        allocations: allocations.map((allocation: any) => ({
          id: faker.string.uuid(),
          invoiceId: allocation.invoiceId,
          invoiceNumber: allocation.invoiceNumber,
          amount: allocation.amount
        }))
      };

      // Automatically create journal entry for the payment
      try {
        const { createPaymentJournalEntry } = await import('./accounting-integration');
        await createPaymentJournalEntry(payment, 1); // Using user ID 1 as default
      } catch (journalError) {
        console.error("Error creating journal entry for payment:", journalError);
        // Continue even if journal entry fails
      }
      
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });
}

export default registerCustomerPaymentRoutes;