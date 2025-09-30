import fs from 'fs';
import path from 'path';

interface Account {
  code: string;
  name: string;
  type: string;
}

interface Expense {
  id: string;
  date: string;
  accountCode: string;
  accountName: string;
  description: string;
  amount: number;
  paymentMethod: string;
  costCenter: string;
}

interface Purchase {
  id: string;
  invoiceNo: string;
  date: string;
  supplier: string;
  item: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatPct: number;
  vatAmount: number;
  paymentMethod: string;
  paidStatus: string;
}

interface DueInvoice {
  id: string;
  client: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  vat: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
}

export interface FinancialData {
  accounts: Account[];
  expenses: Expense[];
  purchases: Purchase[];
  dueInvoices: DueInvoice[];
}

let financialData: FinancialData | null = null;

export function loadFinancialData(): FinancialData {
  if (financialData) {
    return financialData;
  }

  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    financialData = JSON.parse(fileContent) as FinancialData;
    return financialData;
  } catch (error) {
    console.error('Error loading financial data:', error);
    // Return empty data structure if file not found
    return {
      accounts: [],
      expenses: [],
      purchases: [],
      dueInvoices: []
    };
  }
}