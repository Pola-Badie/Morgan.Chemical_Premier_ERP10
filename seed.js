import fs from 'fs';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

// Helper function to generate a random date between start and end
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to format date to YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to generate random invoice number (8-char uppercase)
function generateInvoiceNumber() {
  return faker.string.alphanumeric(8).toUpperCase();
}

// Helper function to generate a random item from array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to calculate VAT amount
function calculateVat(amount, vatPct = 14) {
  return amount * (vatPct / 100);
}

// Generate Data
function generateData() {
  const today = new Date();
  const startOfYear = new Date(2025, 0, 1); // January 1, 2025
  
  // 1. Chart of Accounts - Predefined
  const accounts = [
    { code: "100100", name: "Cash", type: "Asset" },
    { code: "100200", name: "Accounts Receivable", type: "Asset" },
    { code: "200100", name: "Accounts Payable", type: "Liability" },
    { code: "300100", name: "Equity", type: "Equity" },
    { code: "400100", name: "Sales Revenue", type: "Revenue" },
    { code: "500100", name: "Cost of Goods Sold", type: "Expense" },
    { code: "600100", name: "Operating Expenses", type: "Expense" }
  ];
  
  // 2. Expenses - 50 records
  const costCenters = ["Marketing", "R&D", "Production", "Admin"];
  const paymentMethods = ["Cash", "Bank Transfer", "Current Account"];
  
  const expenses = Array.from({ length: 50 }, () => {
    const date = randomDate(startOfYear, today);
    const amount = faker.number.float({ min: 500, max: 10000, precision: 0.01 });
    
    return {
      id: uuidv4(),
      date: formatDate(date),
      accountCode: "600100",
      accountName: "Operating Expenses",
      description: faker.company.catchPhrase(),
      amount: amount,
      paymentMethod: randomItem(paymentMethods),
      costCenter: randomItem(costCenters)
    };
  });
  
  // 3. Purchases - 40 records
  const items = ["Sulfuric Acid", "Sodium Hydroxide", "Ethanol", "Acetone"];
  const paidStatuses = ["Paid", "Partially Paid", "Unpaid"];
  
  const purchases = Array.from({ length: 40 }, () => {
    const date = randomDate(startOfYear, today);
    const quantity = faker.number.int({ min: 1, max: 100 });
    const unitPrice = faker.number.float({ min: 10, max: 500, precision: 0.01 });
    const total = quantity * unitPrice;
    const vatPct = 14;
    const vatAmount = calculateVat(total, vatPct);
    
    return {
      id: uuidv4(),
      invoiceNo: generateInvoiceNumber(),
      date: formatDate(date),
      supplier: faker.company.name(),
      item: randomItem(items),
      quantity: quantity,
      unitPrice: unitPrice,
      total: total,
      vatPct: vatPct,
      vatAmount: vatAmount,
      paymentMethod: randomItem(["Cash", "Credit", "Bank Transfer"]),
      paidStatus: randomItem(paidStatuses)
    };
  });
  
  // 4. Due Invoices - 25 records
  const dueInvoices = Array.from({ length: 25 }, () => {
    const invoiceDate = randomDate(startOfYear, today);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(invoiceDate.getDate() + faker.number.int({ min: 7, max: 30 }));
    
    const subtotal = faker.number.float({ min: 1000, max: 20000, precision: 0.01 });
    const vat = calculateVat(subtotal);
    const totalAmount = subtotal + vat;
    
    // Determine if paid or partially paid
    const isPaid = faker.datatype.boolean();
    const isPartial = !isPaid && faker.datatype.boolean();
    
    let amountPaid = 0;
    if (isPaid) {
      amountPaid = totalAmount;
    } else if (isPartial) {
      amountPaid = faker.number.float({ min: 0, max: totalAmount, precision: 0.01 });
    }
    
    const balance = totalAmount - amountPaid;
    
    // Determine status
    let status;
    if (amountPaid >= totalAmount) {
      status = "Paid";
    } else if (dueDate < today) {
      status = "Overdue";
    } else {
      status = "Unpaid";
    }
    
    return {
      id: uuidv4(),
      client: faker.company.name(),
      invoiceDate: formatDate(invoiceDate),
      dueDate: formatDate(dueDate),
      subtotal: subtotal,
      vat: vat,
      totalAmount: totalAmount,
      amountPaid: amountPaid,
      balance: balance,
      status: status
    };
  });
  
  // Compile all data
  const data = {
    accounts,
    expenses,
    purchases,
    dueInvoices
  };
  
  return data;
}

// Generate the data
const data = generateData();

// Write to file
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

console.log('✅ data.json successfully seeded.');