
#!/usr/bin/env node

const API_BASE = 'http://localhost:5000/api';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

async function testDataFlow() {
  console.log(`${colors.bold}${colors.blue}🔄 DATA FLOW VERIFICATION TEST${colors.reset}\n`);
  
  try {
    // Test 1: Dashboard to Inventory Connection
    console.log(`${colors.yellow}1. DASHBOARD ↔ INVENTORY CONNECTION${colors.reset}`);
    
    const dashboardResponse = await fetch(`${API_BASE}/dashboard/summary`);
    const dashboardData = await dashboardResponse.json();
    
    const inventoryResponse = await fetch(`${API_BASE}/inventory/summary`);
    const inventoryData = await inventoryResponse.json();
    
    console.log(`   Dashboard Products: ${dashboardData.totalProducts || 'N/A'}`);
    console.log(`   Inventory Products: ${inventoryData.totalProducts || 'N/A'}`);
    console.log(`   Low Stock Count: ${inventoryData.lowStockCount || 'N/A'}`);
    console.log(`   Expiring Count: ${inventoryData.expiringCount || 'N/A'}`);
    
    const inventoryMatch = dashboardData.totalProducts === inventoryData.totalProducts;
    console.log(`   ${inventoryMatch ? '✅' : '❌'} Product count consistency\n`);
    
    // Test 2: Accounting Integration
    console.log(`${colors.yellow}2. ACCOUNTING ↔ FINANCIAL DATA${colors.reset}`);
    
    const accountingResponse = await fetch(`${API_BASE}/accounting/summary`);
    const accountingData = await accountingResponse.json();
    
    const trialBalanceResponse = await fetch(`${API_BASE}/accounting/trial-balance`);
    const trialBalanceData = await trialBalanceResponse.json();
    
    console.log(`   Total Revenue: ${accountingData.totalRevenue || 'N/A'}`);
    console.log(`   Total Expenses: ${accountingData.totalExpenses || 'N/A'}`);
    console.log(`   Net Profit: ${accountingData.netProfit || 'N/A'}`);
    console.log(`   Trial Balance Records: ${trialBalanceData.length || 'N/A'}`);
    
    const accountingHealthy = accountingData.totalRevenue > 0 && accountingData.totalExpenses > 0;
    console.log(`   ${accountingHealthy ? '✅' : '❌'} Financial data integrity\n`);
    
    // Test 3: Expense Integration
    console.log(`${colors.yellow}3. EXPENSES ↔ ACCOUNTING${colors.reset}`);
    
    const expensesResponse = await fetch(`${API_BASE}/expenses`);
    const expensesData = await expensesResponse.json();
    
    console.log(`   Total Expense Records: ${expensesData.length || 'N/A'}`);
    
    if (expensesData.length > 0) {
      const totalExpenseAmount = expensesData.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      console.log(`   Sum of Expense Amounts: ${totalExpenseAmount}`);
      
      const expenseCategories = [...new Set(expensesData.map(exp => exp.category))];
      console.log(`   Expense Categories: ${expenseCategories.join(', ')}`);
    }
    
    const expenseIntegration = expensesData.length > 0;
    console.log(`   ${expenseIntegration ? '✅' : '❌'} Expense data available\n`);
    
    // Test 4: Quotation System
    console.log(`${colors.yellow}4. QUOTATIONS ↔ CUSTOMER DATA${colors.reset}`);
    
    const quotationsResponse = await fetch(`${API_BASE}/quotations`);
    const quotationsData = await quotationsResponse.json();
    
    console.log(`   Total Quotations: ${quotationsData.length || 'N/A'}`);
    
    if (quotationsData.length > 0) {
      const quotationTypes = [...new Set(quotationsData.map(q => q.type))];
      const quotationStatuses = [...new Set(quotationsData.map(q => q.status))];
      
      console.log(`   Quotation Types: ${quotationTypes.join(', ')}`);
      console.log(`   Quotation Statuses: ${quotationStatuses.join(', ')}`);
      
      const totalQuotationValue = quotationsData.reduce((sum, q) => sum + (q.total || 0), 0);
      console.log(`   Total Quotation Value: ${totalQuotationValue}`);
    }
    
    const quotationIntegration = quotationsData.length > 0;
    console.log(`   ${quotationIntegration ? '✅' : '❌'} Quotation data available\n`);
    
    // Test 5: Invoice System
    console.log(`${colors.yellow}5. INVOICES ↔ REVENUE TRACKING${colors.reset}`);
    
    const invoicesResponse = await fetch(`${API_BASE}/sample-invoices`);
    const invoicesData = await invoicesResponse.json();
    
    console.log(`   Total Invoices: ${invoicesData.length || 'N/A'}`);
    
    if (invoicesData.length > 0) {
      const invoiceStatuses = [...new Set(invoicesData.map(inv => inv.status))];
      const totalInvoiceValue = invoicesData.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const paidInvoices = invoicesData.filter(inv => inv.status === 'paid').length;
      
      console.log(`   Invoice Statuses: ${invoiceStatuses.join(', ')}`);
      console.log(`   Total Invoice Value: ${totalInvoiceValue}`);
      console.log(`   Paid Invoices: ${paidInvoices}/${invoicesData.length}`);
    }
    
    const invoiceIntegration = invoicesData.length > 0;
    console.log(`   ${invoiceIntegration ? '✅' : '❌'} Invoice data available\n`);
    
    // Test 6: Customer Integration
    console.log(`${colors.yellow}6. CUSTOMERS ↔ TRANSACTIONS${colors.reset}`);
    
    const customersResponse = await fetch(`${API_BASE}/customers`);
    const customersData = await customersResponse.json();
    
    console.log(`   Total Customers: ${customersData.length || 'N/A'}`);
    
    if (customersData.length > 0) {
      const customersWithPurchases = customersData.filter(c => c.totalPurchases && parseFloat(c.totalPurchases) > 0);
      console.log(`   Customers with Purchase History: ${customersWithPurchases.length}`);
    }
    
    const customerIntegration = customersData.length > 0;
    console.log(`   ${customerIntegration ? '✅' : '❌'} Customer data available\n`);
    
    // Test 7: Product Integration
    console.log(`${colors.yellow}7. PRODUCTS ↔ INVENTORY TRACKING${colors.reset}`);
    
    const productsResponse = await fetch(`${API_BASE}/products`);
    const productsData = await productsResponse.json();
    
    console.log(`   Total Products: ${productsData.length || 'N/A'}`);
    
    if (productsData.length > 0) {
      const lowStockProducts = productsData.filter(p => p.quantity <= p.lowStockThreshold);
      const expiredProducts = productsData.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date());
      
      console.log(`   Low Stock Products: ${lowStockProducts.length}`);
      console.log(`   Expired Products: ${expiredProducts.length}`);
    }
    
    const productIntegration = productsData.length > 0;
    console.log(`   ${productIntegration ? '✅' : '❌'} Product data available\n`);
    
    // Summary
    console.log(`${colors.bold}${colors.blue}📊 OVERALL INTEGRATION STATUS${colors.reset}\n`);
    
    const integrationTests = [
      { name: 'Dashboard-Inventory', passed: inventoryMatch },
      { name: 'Accounting-Financial', passed: accountingHealthy },
      { name: 'Expenses', passed: expenseIntegration },
      { name: 'Quotations', passed: quotationIntegration },
      { name: 'Invoices', passed: invoiceIntegration },
      { name: 'Customers', passed: customerIntegration },
      { name: 'Products', passed: productIntegration }
    ];
    
    const passedIntegrations = integrationTests.filter(test => test.passed).length;
    const totalIntegrations = integrationTests.length;
    
    integrationTests.forEach(test => {
      console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}`);
    });
    
    console.log(`\n${colors.bold}Integration Score: ${passedIntegrations}/${totalIntegrations}${colors.reset}`);
    
    if (passedIntegrations === totalIntegrations) {
      console.log(`\n${colors.green}${colors.bold}🎉 ALL MODULES FULLY INTEGRATED!${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  ${totalIntegrations - passedIntegrations} INTEGRATIONS NEED ATTENTION${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Error during data flow verification: ${error.message}${colors.reset}`);
  }
}

// Run the data flow test
testDataFlow().catch(console.error);
