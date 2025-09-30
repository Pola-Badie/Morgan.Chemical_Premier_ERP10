// Test script to verify warehouse import functionality
import fetch from 'node-fetch';

const testData = {
  type: 'products',
  warehouse: 'Packaging',
  data: [
    {
      name: 'Test Import Product',
      drugName: 'Test Active Ingredient',
      sku: 'TEST-IMPORT-001',
      costPrice: '10.00',
      sellingPrice: '25.00',
      quantity: '100',
      unitOfMeasure: 'Tablets',
      location: 'Should Be Overridden',
      description: 'Test product for warehouse import verification',
      lowStockThreshold: '20',
      status: 'active',
      categoryId: '1',
      productType: 'finished',
      expiryDate: '2025-12-31'
    }
  ]
};

async function testImport() {
  try {
    console.log('Testing warehouse import functionality...');
    console.log('Sending to:', 'http://localhost:5000/api/bulk/import-json');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/bulk/import-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('Import result:', result);
    
    // Verify the product was assigned to the correct warehouse
    const productResponse = await fetch('http://localhost:5000/api/products');
    const products = await productResponse.json();
    
    const importedProduct = products.find(p => p.sku === 'TEST-IMPORT-001');
    if (importedProduct) {
      console.log('✅ Product found:', {
        name: importedProduct.name,
        sku: importedProduct.sku,
        location: importedProduct.location,
        quantity: importedProduct.quantity
      });
      
      if (importedProduct.location === 'Packaging') {
        console.log('✅ SUCCESS: Product correctly assigned to Packaging warehouse!');
      } else {
        console.log('❌ FAILURE: Product assigned to wrong warehouse:', importedProduct.location);
      }
    } else {
      console.log('❌ FAILURE: Imported product not found!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImport();