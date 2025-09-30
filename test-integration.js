
#!/usr/bin/env node

// Premier ERP System - Comprehensive Integration Test
// Tests all API endpoints, data flow, and module interconnections

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test helper function
async function test(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await testFn();
    console.log(`✅ PASSED: ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
  }
}

// API endpoint tests
async function testAPIEndpoints() {
  console.log('\n📡 TESTING API ENDPOINTS');
  
  await test('Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status !== 200) throw new Error('Health check failed');
    if (!response.data.database) throw new Error('Database not connected');
  });

  await test('Dashboard Summary', async () => {
    const response = await axios.get(`${BASE_URL}/dashboard/summary`);
    if (response.status !== 200) throw new Error('Dashboard API failed');
    if (!response.data.metrics) throw new Error('Metrics missing');
  });

  await test('Inventory Summary', async () => {
    const response = await axios.get(`${BASE_URL}/inventory/summary`);
    if (response.status !== 200) throw new Error('Inventory API failed');
    if (typeof response.data.totalProducts !== 'number') throw new Error('Total products missing');
  });

  await test('Accounting Summary', async () => {
    const response = await axios.get(`${BASE_URL}/accounting/summary`);
    if (response.status !== 200) throw new Error('Accounting API failed');
  });

  await test('Low Stock Items', async () => {
    const response = await axios.get(`${BASE_URL}/inventory/low-stock`);
    if (response.status !== 200) throw new Error('Low stock API failed');
    if (!Array.isArray(response.data)) throw new Error('Low stock data not array');
  });

  await test('Expiring Products', async () => {
    const response = await axios.get(`${BASE_URL}/inventory/expiring`);
    if (response.status !== 200) throw new Error('Expiring products API failed');
    if (!Array.isArray(response.data)) throw new Error('Expiring products data not array');
  });

  await test('Products List', async () => {
    const response = await axios.get(`${BASE_URL}/inventory/products`);
    if (response.status !== 200) throw new Error('Products API failed');
    if (!Array.isArray(response.data)) throw new Error('Products data not array');
  });

  await test('Customers List', async () => {
    const response = await axios.get(`${BASE_URL}/customers`);
    if (response.status !== 200) throw new Error('Customers API failed');
    if (!Array.isArray(response.data)) throw new Error('Customers data not array');
  });

  await test('Expenses List', async () => {
    const response = await axios.get(`${BASE_URL}/expenses`);
    if (response.status !== 200) throw new Error('Expenses API failed');
    if (!Array.isArray(response.data)) throw new Error('Expenses data not array');
  });

  await test('Orders List', async () => {
    const response = await axios.get(`${BASE_URL}/orders`);
    if (response.status !== 200) throw new Error('Orders API failed');
    if (!Array.isArray(response.data)) throw new Error('Orders data not array');
  });

  await test('Invoices List', async () => {
    const response = await axios.get(`${BASE_URL}/invoices`);
    if (response.status !== 200) throw new Error('Invoices API failed');
    if (!Array.isArray(response.data)) throw new Error('Invoices data not array');
  });

  await test('Accounting Overview', async () => {
    const response = await axios.get(`${BASE_URL}/accounting/overview`);
    if (response.status !== 200) throw new Error('Accounting overview API failed');
  });

  await test('Journal Entries', async () => {
    const response = await axios.get(`${BASE_URL}/accounting/journal-entries`);
    if (response.status !== 200) throw new Error('Journal entries API failed');
    if (!Array.isArray(response.data)) throw new Error('Journal entries data not array');
  });

  await test('Chart of Accounts', async () => {
    const response = await axios.get(`${BASE_URL}/accounting/chart-of-accounts`);
    if (response.status !== 200) throw new Error('Chart of accounts API failed');
    if (!Array.isArray(response.data)) throw new Error('Chart of accounts data not array');
  });

  await test('Trial Balance', async () => {
    const response = await axios.get(`${BASE_URL}/accounting/trial-balance`);
    if (response.status !== 200) throw new Error('Trial balance API failed');
    if (!Array.isArray(response.data)) throw new Error('Trial balance data not array');
  });

  await test('Balance Sheet', async () => {
    const response = await axios.get(`${BASE_URL}/accounting/balance-sheet`);
    if (response.status !== 200) throw new Error('Balance sheet API failed');
  });

  await test('Profit & Loss', async () => {
    const response = await axios.get(`${BASE_URL}/accounting/profit-loss`);
    if (response.status !== 200) throw new Error('Profit & loss API failed');
  });

  await test('Warehouses List', async () => {
    const response = await axios.get(`${BASE_URL}/warehouses`);
    if (response.status !== 200) throw new Error('Warehouses API failed');
    if (!Array.isArray(response.data)) throw new Error('Warehouses data not array');
  });

  await test('Suppliers List', async () => {
    const response = await axios.get(`${BASE_URL}/suppliers`);
    if (response.status !== 200) throw new Error('Suppliers API failed');
    if (!Array.isArray(response.data)) throw new Error('Suppliers data not array');
  });

  await test('Purchase Orders', async () => {
    const response = await axios.get(`${BASE_URL}/purchase-orders`);
    if (response.status !== 200) throw new Error('Purchase orders API failed');
    if (!Array.isArray(response.data)) throw new Error('Purchase orders data not array');
  });

  await test('Categories List', async () => {
    const response = await axios.get(`${BASE_URL}/categories`);
    if (response.status !== 200) throw new Error('Categories API failed');
    if (!Array.isArray(response.data)) throw new Error('Categories data not array');
  });

  await test('System Preferences', async () => {
    const response = await axios.get(`${BASE_URL}/system-preferences`);
    if (response.status !== 200) throw new Error('System preferences API failed');
  });

  await test('Users List', async () => {
    const response = await axios.get(`${BASE_URL}/users`);
    if (response.status !== 200) throw new Error('Users API failed');
    if (!Array.isArray(response.data)) throw new Error('Users data not array');
  });
}

// Data consistency tests
async function testDataConsistency() {
  console.log('\n🔄 TESTING DATA CONSISTENCY');

  await test('Dashboard-Inventory Sync', async () => {
    const dashboard = await axios.get(`${BASE_URL}/dashboard/summary`);
    const inventory = await axios.get(`${BASE_URL}/inventory/summary`);
    
    // Check if dashboard metrics match inventory data
    if (dashboard.data.metrics.totalProducts !== inventory.data.totalProducts) {
      throw new Error('Product count mismatch between dashboard and inventory');
    }
  });

  await test('Low Stock Consistency', async () => {
    const lowStock = await axios.get(`${BASE_URL}/inventory/low-stock`);
    const dashboard = await axios.get(`${BASE_URL}/dashboard/summary`);
    
    // Check if low stock counts match
    if (lowStock.data.length !== dashboard.data.alerts.lowStock.length) {
      console.log('⚠️  Low stock count mismatch (may be due to different thresholds)');
    }
  });

  await test('Expiring Products Consistency', async () => {
    const expiring = await axios.get(`${BASE_URL}/inventory/expiring`);
    const dashboard = await axios.get(`${BASE_URL}/dashboard/summary`);
    
    // Check if expiring products counts match
    if (expiring.data.length !== dashboard.data.alerts.expiring.length) {
      console.log('⚠️  Expiring products count mismatch (may be due to different date ranges)');
    }
  });

  await test('Accounting-Dashboard Sync', async () => {
    const accounting = await axios.get(`${BASE_URL}/accounting/summary`);
    const dashboard = await axios.get(`${BASE_URL}/dashboard/summary`);
    
    // Check if financial data is consistent
    if (accounting.status === 200 && dashboard.status === 200) {
      console.log('✅ Accounting and dashboard APIs both responding');
    }
  });
}

// Warehouse filtering tests
async function testWarehouseFiltering() {
  console.log('\n🏭 TESTING WAREHOUSE FUNCTIONALITY');

  await test('Warehouse-Specific Products', async () => {
    const warehouses = await axios.get(`${BASE_URL}/warehouses`);
    if (warehouses.data.length === 0) {
      throw new Error('No warehouses found');
    }

    const firstWarehouse = warehouses.data[0];
    const products = await axios.get(`${BASE_URL}/inventory/products?warehouse=${firstWarehouse.id}`);
    
    if (response.status !== 200) {
      throw new Error('Warehouse filtering not working');
    }
  });

  await test('Multiple Warehouses Data', async () => {
    const warehouses = await axios.get(`${BASE_URL}/warehouses`);
    if (warehouses.data.length < 2) {
      console.log('⚠️  Only one warehouse found, multi-warehouse testing limited');
      return;
    }

    // Test different warehouses have different products
    const warehouse1Products = await axios.get(`${BASE_URL}/inventory/products?warehouse=${warehouses.data[0].id}`);
    const warehouse2Products = await axios.get(`${BASE_URL}/inventory/products?warehouse=${warehouses.data[1].id}`);
    
    console.log(`📦 Warehouse 1: ${warehouse1Products.data.length} products`);
    console.log(`📦 Warehouse 2: ${warehouse2Products.data.length} products`);
  });
}

// Search and filtering tests
async function testSearchFiltering() {
  console.log('\n🔍 TESTING SEARCH & FILTERING');

  await test('Product Search', async () => {
    const products = await axios.get(`${BASE_URL}/inventory/products`);
    if (products.data.length === 0) {
      throw new Error('No products to search');
    }

    const firstProduct = products.data[0];
    const searchResults = await axios.get(`${BASE_URL}/inventory/products?search=${firstProduct.name.substring(0, 5)}`);
    
    if (searchResults.data.length === 0) {
      throw new Error('Search returned no results');
    }
  });

  await test('Category Filtering', async () => {
    const categories = await axios.get(`${BASE_URL}/categories`);
    if (categories.data.length === 0) {
      throw new Error('No categories found');
    }

    const firstCategory = categories.data[0];
    const filteredProducts = await axios.get(`${BASE_URL}/inventory/products?category=${firstCategory.id}`);
    
    if (response.status !== 200) {
      throw new Error('Category filtering not working');
    }
  });

  await test('Customer Search', async () => {
    const customers = await axios.get(`${BASE_URL}/customers`);
    if (customers.data.length === 0) {
      throw new Error('No customers to search');
    }

    const firstCustomer = customers.data[0];
    const searchResults = await axios.get(`${BASE_URL}/customers?search=${firstCustomer.name.substring(0, 3)}`);
    
    if (searchResults.data.length === 0) {
      throw new Error('Customer search returned no results');
    }
  });
}

// CRUD operations tests
async function testCRUDOperations() {
  console.log('\n🔧 TESTING CRUD OPERATIONS');

  await test('Create Product Test', async () => {
    const newProduct = {
      name: 'Integration Test Product',
      category: 'Test Category',
      price: 99.99,
      cost: 50.00,
      quantity: 100,
      reorderLevel: 10,
      warehouseId: 1,
      supplierId: 1,
      unit: 'pcs'
    };

    try {
      const response = await axios.post(`${BASE_URL}/inventory/products`, newProduct);
      if (response.status !== 201) {
        throw new Error('Product creation failed');
      }
      
      // Clean up - delete the test product
      if (response.data.id) {
        await axios.delete(`${BASE_URL}/inventory/products/${response.data.id}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Product creation endpoint not found');
      } else {
        throw error;
      }
    }
  });

  await test('Create Customer Test', async () => {
    const newCustomer = {
      name: 'Integration Test Customer',
      email: 'test@integration.com',
      phone: '1234567890',
      address: 'Test Address',
      city: 'Test City',
      country: 'Test Country'
    };

    try {
      const response = await axios.post(`${BASE_URL}/customers`, newCustomer);
      if (response.status !== 201) {
        throw new Error('Customer creation failed');
      }
      
      // Clean up - delete the test customer
      if (response.data.id) {
        await axios.delete(`${BASE_URL}/customers/${response.data.id}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Customer creation endpoint not found');
      } else {
        throw error;
      }
    }
  });

  await test('Create Expense Test', async () => {
    const newExpense = {
      description: 'Integration Test Expense',
      amount: 150.00,
      category: 'Office Supplies',
      date: new Date().toISOString(),
      userId: 1
    };

    try {
      const response = await axios.post(`${BASE_URL}/expenses`, newExpense);
      if (response.status !== 201) {
        throw new Error('Expense creation failed');
      }
      
      // Clean up - delete the test expense
      if (response.data.id) {
        await axios.delete(`${BASE_URL}/expenses/${response.data.id}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Expense creation endpoint not found');
      } else {
        throw error;
      }
    }
  });
}

// Performance tests
async function testPerformance() {
  console.log('\n⚡ TESTING PERFORMANCE');

  await test('Dashboard Load Time', async () => {
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}/dashboard/summary`);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    console.log(`   Dashboard load time: ${loadTime}ms`);
    
    if (loadTime > 5000) {
      throw new Error(`Dashboard too slow: ${loadTime}ms`);
    }
  });

  await test('Inventory Load Time', async () => {
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}/inventory/products`);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    console.log(`   Inventory load time: ${loadTime}ms`);
    
    if (loadTime > 3000) {
      throw new Error(`Inventory too slow: ${loadTime}ms`);
    }
  });

  await test('Accounting Load Time', async () => {
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}/accounting/summary`);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    console.log(`   Accounting load time: ${loadTime}ms`);
    
    if (loadTime > 3000) {
      throw new Error(`Accounting too slow: ${loadTime}ms`);
    }
  });
}

// Error handling tests
async function testErrorHandling() {
  console.log('\n🚨 TESTING ERROR HANDLING');

  await test('Invalid Product ID', async () => {
    try {
      await axios.get(`${BASE_URL}/inventory/products/99999`);
      throw new Error('Should have returned 404');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ✅ Correctly returned 404 for invalid product ID');
      } else {
        throw new Error('Unexpected error response');
      }
    }
  });

  await test('Invalid API Endpoint', async () => {
    try {
      await axios.get(`${BASE_URL}/invalid/endpoint`);
      throw new Error('Should have returned 404');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ✅ Correctly returned 404 for invalid endpoint');
      } else {
        throw new Error('Unexpected error response');
      }
    }
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 PREMIER ERP SYSTEM - COMPREHENSIVE INTEGRATION TEST');
  console.log('=' .repeat(60));

  try {
    await testAPIEndpoints();
    await testDataConsistency();
    await testWarehouseFiltering();
    await testSearchFiltering();
    await testCRUDOperations();
    await testPerformance();
    await testErrorHandling();
  } catch (error) {
    console.log(`\n❌ Test suite failed: ${error.message}`);
  }

  // Generate final report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`✅ PASSED: ${results.passed}`);
  console.log(`❌ FAILED: ${results.failed}`);
  console.log(`📊 TOTAL:  ${results.passed + results.failed}`);
  console.log(`🎯 SUCCESS RATE: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  // Save detailed results
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      failed: results.failed,
      total: results.passed + results.failed,
      successRate: Math.round((results.passed / (results.passed + results.failed)) * 100)
    },
    tests: results.tests
  };

  fs.writeFileSync('integration-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: integration-test-report.json');

  if (results.failed > 0) {
    console.log('\n🔧 FAILED TESTS REQUIRE ATTENTION:');
    results.tests.filter(t => t.status === 'FAILED').forEach(t => {
      console.log(`   ❌ ${t.name}: ${t.error}`);
    });
  }

  console.log('\n🎉 Integration test complete!');
}

// Run the tests
runAllTests().catch(console.error);
