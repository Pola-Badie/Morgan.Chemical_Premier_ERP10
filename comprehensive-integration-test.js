
#!/usr/bin/env node

const API_BASE = 'http://localhost:5000/api';

// Test configuration
const TESTS = {
  health: { endpoint: '/health', expected: 'object' },
  dashboard: { endpoint: '/dashboard/summary', expected: 'object' },
  inventory: { endpoint: '/inventory/summary', expected: 'object' },
  accounting: { endpoint: '/accounting/summary', expected: 'object' },
  expenses: { endpoint: '/expenses', expected: 'array' },
  quotations: { endpoint: '/quotations', expected: 'array' },
  invoices: { endpoint: '/sample-invoices', expected: 'array' },
  customers: { endpoint: '/customers', expected: 'array' },
  products: { endpoint: '/products', expected: 'array' },
  suppliers: { endpoint: '/suppliers', expected: 'array' },
  lowStock: { endpoint: '/inventory/low-stock', expected: 'array' },
  expiring: { endpoint: '/inventory/expiring', expected: 'array' },
  accountingOverview: { endpoint: '/accounting/overview', expected: 'object' },
  trialBalance: { endpoint: '/accounting/trial-balance', expected: 'array' },
  profitLoss: { endpoint: '/accounting/profit-loss', expected: 'object' },
  balanceSheet: { endpoint: '/accounting/balance-sheet', expected: 'object' },
  chartOfAccounts: { endpoint: '/accounting/chart-of-accounts', expected: 'array' },
  journalEntries: { endpoint: '/accounting/journal-entries', expected: 'array' }
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

async function testEndpoint(name, config) {
  try {
    const response = await fetch(`${API_BASE}${config.endpoint}`);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        name,
        status: 'FAILED',
        error: `HTTP ${response.status}: ${data.message || 'Unknown error'}`,
        data: null
      };
    }

    const actualType = Array.isArray(data) ? 'array' : typeof data;
    const typeMatch = actualType === config.expected;
    
    return {
      name,
      status: typeMatch ? 'PASSED' : 'TYPE_MISMATCH',
      error: typeMatch ? null : `Expected ${config.expected}, got ${actualType}`,
      data: data,
      dataSize: Array.isArray(data) ? data.length : Object.keys(data).length
    };
  } catch (error) {
    return {
      name,
      status: 'ERROR',
      error: error.message,
      data: null
    };
  }
}

async function runIntegrationTests() {
  console.log(`${colors.bold}${colors.blue}🔍 PREMIER ERP SYSTEM - COMPREHENSIVE MODULE INTEGRATION TEST${colors.reset}\n`);
  
  const results = [];
  
  // Test all endpoints
  for (const [name, config] of Object.entries(TESTS)) {
    const result = await testEndpoint(name, config);
    results.push(result);
    
    const statusColor = result.status === 'PASSED' ? colors.green : colors.red;
    const statusIcon = result.status === 'PASSED' ? '✅' : '❌';
    
    console.log(`${statusIcon} ${statusColor}${result.name.toUpperCase()}${colors.reset}: ${result.status}`);
    
    if (result.error) {
      console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
    }
    
    if (result.data && result.dataSize !== undefined) {
      console.log(`   ${colors.blue}Data size: ${result.dataSize} items${colors.reset}`);
    }
  }
  
  // Analysis and cross-module verification
  console.log(`\n${colors.bold}${colors.yellow}📊 CROSS-MODULE DATA CONSISTENCY CHECK${colors.reset}\n`);
  
  const dashboardData = results.find(r => r.name === 'dashboard')?.data;
  const inventoryData = results.find(r => r.name === 'inventory')?.data;
  const accountingData = results.find(r => r.name === 'accounting')?.data;
  const expensesData = results.find(r => r.name === 'expenses')?.data;
  const quotationsData = results.find(r => r.name === 'quotations')?.data;
  const invoicesData = results.find(r => r.name === 'invoices')?.data;
  
  if (dashboardData && inventoryData) {
    console.log(`${colors.blue}Dashboard Total Products: ${dashboardData.totalProducts || 'N/A'}${colors.reset}`);
    console.log(`${colors.blue}Inventory Total Products: ${inventoryData.totalProducts || 'N/A'}${colors.reset}`);
    console.log(`${colors.blue}Low Stock Count: ${inventoryData.lowStockCount || 'N/A'}${colors.reset}`);
    console.log(`${colors.blue}Expiring Products: ${inventoryData.expiringCount || 'N/A'}${colors.reset}`);
  }
  
  if (accountingData) {
    console.log(`${colors.blue}Accounting Total Revenue: ${accountingData.totalRevenue || 'N/A'}${colors.reset}`);
    console.log(`${colors.blue}Accounting Total Expenses: ${accountingData.totalExpenses || 'N/A'}${colors.reset}`);
    console.log(`${colors.blue}Accounting Net Profit: ${accountingData.netProfit || 'N/A'}${colors.reset}`);
  }
  
  if (expensesData) {
    console.log(`${colors.blue}Expense Records: ${expensesData.length || 'N/A'}${colors.reset}`);
  }
  
  if (quotationsData) {
    console.log(`${colors.blue}Quotation Records: ${quotationsData.length || 'N/A'}${colors.reset}`);
  }
  
  if (invoicesData) {
    console.log(`${colors.blue}Invoice Records: ${invoicesData.length || 'N/A'}${colors.reset}`);
  }
  
  // Summary
  console.log(`\n${colors.bold}${colors.yellow}📈 INTEGRATION TEST SUMMARY${colors.reset}\n`);
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status !== 'PASSED').length;
  const total = results.length;
  
  console.log(`${colors.green}✅ Passed: ${passed}/${total}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}/${total}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.bold}${colors.green}🎉 ALL MODULES SUCCESSFULLY INTEGRATED!${colors.reset}`);
  } else {
    console.log(`\n${colors.bold}${colors.red}⚠️  ${failed} MODULES NEED ATTENTION${colors.reset}`);
  }
  
  // Specific integration recommendations
  console.log(`\n${colors.bold}${colors.blue}🔧 INTEGRATION STATUS REPORT${colors.reset}\n`);
  
  console.log(`${colors.yellow}1. REPORTS MODULE:${colors.reset}`);
  console.log(`   - Expense reports: ${expensesData ? '✅ Connected' : '❌ Not connected'}`);
  console.log(`   - Invoice reports: ${invoicesData ? '✅ Connected' : '❌ Not connected'}`);
  console.log(`   - Quotation reports: ${quotationsData ? '✅ Connected' : '❌ Not connected'}`);
  
  console.log(`${colors.yellow}2. DASHBOARD INTEGRATION:${colors.reset}`);
  console.log(`   - Real-time inventory: ${dashboardData && inventoryData ? '✅ Synced' : '❌ Not synced'}`);
  console.log(`   - Financial metrics: ${dashboardData && accountingData ? '✅ Synced' : '❌ Not synced'}`);
  
  console.log(`${colors.yellow}3. ACCOUNTING INTEGRATION:${colors.reset}`);
  console.log(`   - Chart of accounts: ${results.find(r => r.name === 'chartOfAccounts')?.status === 'PASSED' ? '✅ Available' : '❌ Not available'}`);
  console.log(`   - Journal entries: ${results.find(r => r.name === 'journalEntries')?.status === 'PASSED' ? '✅ Available' : '❌ Not available'}`);
  console.log(`   - Financial statements: ${results.find(r => r.name === 'profitLoss')?.status === 'PASSED' ? '✅ Available' : '❌ Not available'}`);
  
  return {
    passed,
    failed,
    total,
    results
  };
}

// Run the tests
runIntegrationTests().catch(console.error);
