// TypeScript interfaces for Financial Reports API responses

export interface AccountBalance {
  code: string;
  name: string;
  type: 'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debit: number;
  credit: number;
  balance: number;
  isActive: boolean;
}

export interface TrialBalanceResponse {
  accounts: AccountBalance[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface AccountSummary {
  name: string;
  amount: number;
}

export interface ProfitLossResponse {
  revenue: {
    accounts: AccountSummary[];
    total: number;
  };
  expenses: {
    accounts: AccountSummary[];
    total: number;
  };
  netIncome: number;
  profitMargin: number;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface BalanceSheetResponse {
  assets: {
    accounts: AccountSummary[];
    total: number;
  };
  liabilities: {
    accounts: AccountSummary[];
    total: number;
  };
  equity: {
    accounts: AccountSummary[];
    total: number;
  };
  isBalanced: boolean;
  generatedAt: string;
  asOfDate: string;
}

export interface CashFlowResponse {
  operatingActivities: {
    inflows: number;
    outflows: number;
    net: number;
  };
  investingActivities: {
    inflows: number;
    outflows: number;
    net: number;
  };
  financingActivities: {
    inflows: number;
    outflows: number;
    net: number;
  };
  totalCashFlow: number;
  beginningCash: number;
  endingCash: number;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface ChartOfAccountsResponse {
  accounts: AccountBalance[];
  generatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  accountCode: string;
  accountName: string;
}

export interface JournalEntriesResponse {
  entries: JournalEntry[];
  totalEntries: number;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface GeneralLedgerEntry {
  date: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface GeneralLedgerResponse {
  accountCode: string;
  accountName: string;
  entries: GeneralLedgerEntry[];
  beginningBalance: number;
  endingBalance: number;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface AccountTypeSummary {
  type: 'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  count: number;
  totalDebit: number;
  totalCredit: number;
}

export interface AccountSummaryResponse {
  summary: AccountTypeSummary[];
  generatedAt: string;
}

export interface AgingAnalysisResponse {
  current: {
    count: number;
    amount: number;
  };
  thirtyDays: {
    count: number;
    amount: number;
  };
  sixtyDays: {
    count: number;
    amount: number;
  };
  ninetyDays: {
    count: number;
    amount: number;
  };
  total: {
    count: number;
    amount: number;
  };
  generatedAt: string;
}

// Report data structure for UI display
export interface ReportData {
  title: string;
  headers: string[];
  rows: string[][];
  totals?: string[];
  summary?: any;
  _timestamp: number;
}

// Export formats
export interface ExportOptions {
  format: 'pdf' | 'excel';
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
  asOfDate?: string;
  accountFilter?: 'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

// API error response
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Filter options
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  accountFilter?: 'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  includeZeroBalance?: boolean;
  showTransactionDetails?: boolean;
  groupByAccountType?: boolean;
}

// Report types enum
export type ReportType = 
  | 'trial-balance'
  | 'profit-loss'
  | 'balance-sheet'
  | 'cash-flow'
  | 'chart-of-accounts'
  | 'journal-entries'
  | 'general-ledger'
  | 'account-summary'
  | 'aging-analysis';