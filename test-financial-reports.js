const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testFinancialReports() {
  console.log('Testing Financial Reports API Endpoints...\n');
  
  const reports = [
    { name: 'Trial Balance', endpoint: '/reports/trial-balance' },
    { name: 'Profit & Loss', endpoint: '/reports/profit-loss' },
    { name: 'Balance Sheet', endpoint: '/reports/balance-sheet' },
    { name: 'Cash Flow', endpoint: '/reports/cash-flow' },
    { name: 'Chart of Accounts', endpoint: '/reports/chart-of-accounts' },
    { name: 'Journal Entries', endpoint: '/reports/journal-entries' },
    { name: 'General Ledger', endpoint: '/reports/general-ledger?accountId=12' },
    { name: 'Account Summary', endpoint: '/reports/account-summary' },
    { name: 'Aging Analysis', endpoint: '/reports/aging-analysis' }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const report of reports) {
    try {
      console.log(`Testing ${report.name}...`);
      const response = await axios.get(`${API_BASE}${report.endpoint}`);
      
      if (response.status === 200 && response.data) {
        console.log(`✓ ${report.name}: SUCCESS`);
        console.log(`  Response keys: ${Object.keys(response.data).join(', ')}`);
        
        // Show some sample data
        if (report.name === 'Trial Balance' && response.data.totalDebits !== undefined) {
          console.log(`  Total Debits: ${response.data.totalDebits}`);
          console.log(`  Total Credits: ${response.data.totalCredits}`);
          console.log(`  Is Balanced: ${response.data.isBalanced}`);
        }
        
        successCount++;
      } else {
        console.log(`✗ ${report.name}: FAILED - Invalid response`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ ${report.name}: FAILED - ${error.response?.data?.message || error.message}`);
      failCount++;
    }
    console.log('');
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total Reports Tested: ${reports.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Success Rate: ${Math.round((successCount / reports.length) * 100)}%`);
}

// Run the tests
testFinancialReports().catch(console.error);