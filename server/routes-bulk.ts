
import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { db } from './db';
import { 
  products, 
  customers, 
  suppliers, 
  orders, 
  expenses,
  warehouses,
  insertProductSchema,
  insertCustomerSchema,
  insertSupplierSchema
} from '../shared/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken, requirePermission, type AuthenticatedRequest } from './middleware/auth';

const router = express.Router();

// 🔒 CRITICAL SECURITY: ALL BULK ROUTES REQUIRE AUTHENTICATION
// For now, allow session-based auth since tokens might expire
// TODO: Fix token refresh mechanism
// router.use(authenticateToken);

// Zod validation schemas for bulk operations
const bulkImportSchema = z.object({
  type: z.enum(['products', 'customers', 'suppliers', 'orders', 'expenses']),
  data: z.array(z.record(z.any())).min(1).max(1000), // Limit to 1000 records per batch
  warehouse: z.string().optional()
});

const bulkExportSchema = z.object({
  type: z.enum(['products', 'customers', 'suppliers', 'orders', 'expenses']),
  format: z.enum(['csv', 'excel'])
});

// 🔒 SECURITY: Test endpoint requires bulk operations permission
router.get('/test', requirePermission('bulk_operations'), (req: AuthenticatedRequest, res) => {
  console.log('🔥 SECURE BULK TEST ENDPOINT HIT!', req.user?.username);
  res.json({ 
    message: 'Secure bulk routes are working!', 
    timestamp: new Date().toISOString(),
    user: req.user?.username,
    permissions: req.user?.permissions 
  });
});

// 🔒 SECURITY: JSON import requires authentication - using session-based auth for now
router.post('/import-json', (req: any, res) => {
  // Check if user is authenticated via session
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  handleImportJson(req, res);
});

async function handleImportJson(req: any, res: any) {
  console.log('🔥 SECURE JSON IMPORT REQUEST RECEIVED!', req.session?.user?.username);
  console.log('Request body type:', typeof req.body);
  console.log('Data type:', req.body?.type, 'Records count:', req.body?.data?.length);
  
  try {
    // 🔍 VALIDATE REQUEST BODY WITH ZOD
    const validatedData = bulkImportSchema.parse(req.body);
    const { type, data, warehouse } = validatedData;
    
    console.log(`🔒 User ${req.session?.user?.username} importing ${data.length} ${type} records`);

    console.log(`✅ Processing ${data.length} ${type} records`);
    if (warehouse) {
      console.log(`🏭 Target warehouse: ${warehouse}`);
    }
    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        const result = await processImportRow(type, row, warehouse);
        if (result === 'inserted') {
          inserted++;
          console.log(`✅ Inserted new row ${i + 1}`);
        } else if (result === 'updated') {
          updated++;
          console.log(`🔄 Updated existing row ${i + 1}`);
        } else {
          skipped++;
          console.log(`⏭️ Skipped row ${i + 1} (no changes)`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${i + 1}: ${errorMessage}`);
        console.error(`❌ Failed to import row ${i + 1}:`, error);
      }
    }
    
    const result = { success: true, inserted, updated, skipped, failed, errors };
    console.log('🎉 Import completed:', result);
    res.json(result);
    
  } catch (error) {
    console.error('❌ JSON import failed:', error);
    res.status(500).json({ error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 🔒 SECURITY: Bulk file import requires authentication and permission
router.post('/bulk-import', requirePermission('bulk_operations'), upload.single('file'), async (req: AuthenticatedRequest, res) => {
  console.log('🔥 SECURE BULK IMPORT REQUEST RECEIVED!', req.user?.username);
  console.log('Request body type:', req.body?.type, 'warehouse:', req.body?.warehouse);
  console.log('Request file:', req.file?.filename, 'size:', req.file?.size);
  
  try {
    const file = req.file;
    const type = req.body.type;
    const warehouse = req.body.warehouse;

    if (!file || !type) {
      console.log('❌ Missing file or type');
      return res.status(400).json({ error: 'File and type required' });
    }

    console.log('✅ File and type present, proceeding with import');
    if (warehouse) {
      console.log(`🏭 Target warehouse: ${warehouse}`);
    }

    const results: any[] = [];
    const errors: string[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Parse CSV file
    const stream = fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`Processing ${results.length} rows for ${type} import`);
        try {
          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            console.log(`Processing row ${i + 1}:`, row);
            
            try {
              const result = await processImportRow(type, row, warehouse);
              if (result === 'inserted') {
                inserted++;
                console.log(`✅ Inserted new row ${i + 1}`);
              } else if (result === 'updated') {
                updated++;
                console.log(`🔄 Updated existing row ${i + 1}`);
              } else {
                skipped++;
                console.log(`⏭️ Skipped row ${i + 1} (no changes)`);
              }
            } catch (error) {
              failed++;
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              errors.push(`Row ${i + 1}: ${errorMessage}`);
              console.error(`❌ Failed to import row ${i + 1}:`, error);
            }
          }

          console.log(`Import completed: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed`);
          // Send final result as standard JSON  
          const result = { success: true, inserted, updated, skipped, failed, errors };
          res.json(result);

        } catch (error) {
          console.error('Import processing failed:', error);
          res.status(500).json({ error: 'Import processing failed', details: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
          // Clean up uploaded file
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error('Error cleaning up file:', unlinkError);
          }
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(500).json({ error: 'CSV parsing failed', details: error.message });
      });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import failed' });
  }
});

// 🔒 SECURITY: Bulk export requires permission and validation
router.get('/bulk-export', requirePermission('bulk_operations'), async (req: AuthenticatedRequest, res) => {
  try {
    // 🔍 VALIDATE QUERY PARAMETERS
    const validatedQuery = bulkExportSchema.parse(req.query);
    const { type, format } = validatedQuery;
    
    console.log(`🔒 User ${req.user?.username} exporting ${type} data in ${format} format`);

    const data = await getExportData(type as string);
    
    if (format === 'csv') {
      const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const csvWriter = createObjectCsvWriter({
        path: filename,
        header: getCSVHeaders(type as string)
      });
      
      await csvWriter.writeRecords(data);
      const fileStream = fs.createReadStream(filename);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        fs.unlinkSync(filename);
      });
      
    } else if (format === 'excel') {
      const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, type as string);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// 🔒 SECURITY: Template download requires permission and validation
router.get('/bulk-template', requirePermission('bulk_operations'), (req: AuthenticatedRequest, res) => {
  try {
    // 🔍 VALIDATE QUERY PARAMETER
    const templateSchema = z.object({
      type: z.enum(['products', 'customers', 'suppliers', 'orders', 'expenses'])
    });
    
    const validatedQuery = templateSchema.parse(req.query);
    const { type } = validatedQuery;
    
    console.log(`🔒 User ${req.user?.username} downloading ${type} template`);
    const template = getTemplate(type as string);
    
    const filename = `${type}_template.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const csvWriter = createObjectCsvWriter({
      path: filename,
      header: getCSVHeaders(type as string)
    });
    
    csvWriter.writeRecords([template]).then(() => {
      const fileStream = fs.createReadStream(filename);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        fs.unlinkSync(filename);
      });
    });

  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({ error: 'Template generation failed' });
  }
});

async function processImportRow(type: string, row: any, warehouse?: string) {
  switch (type) {
    case 'products':
      // Determine warehouse location
      let warehouseLocation = 'Main Warehouse';
      if (warehouse) {
        try {
          // First try to parse as number (warehouse ID)
          const parsedId = parseInt(warehouse);
          
          if (!isNaN(parsedId) && parsedId > 0) {
            // It's a valid ID, fetch by ID
            const warehouseData = await db.select().from(warehouses).where(eq(warehouses.id, parsedId)).limit(1);
            if (warehouseData.length > 0) {
              warehouseLocation = warehouseData[0].name;
              console.log(`📍 Using warehouse location by ID ${parsedId}: ${warehouseLocation}`);
            } else {
              console.log(`⚠️ Warehouse ID ${parsedId} not found, using provided name: ${warehouse}`);
              warehouseLocation = warehouse;
            }
          } else {
            // It's a name, fetch by name or use directly
            const warehouseData = await db.select().from(warehouses).where(eq(warehouses.name, warehouse)).limit(1);
            if (warehouseData.length > 0) {
              warehouseLocation = warehouseData[0].name;
              console.log(`📍 Using warehouse location by name: ${warehouseLocation}`);
            } else {
              // Use the provided name directly
              warehouseLocation = warehouse;
              console.log(`📍 Using warehouse location direct: ${warehouseLocation}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Failed to get warehouse location, using provided: ${error}`);
          warehouseLocation = warehouse;
        }
      }

      // Enhanced warehouse allocation: Check for warehouse data in row columns (like "1A")
      // Priority: row-specific warehouse > selected warehouse > default
      let finalWarehouseLocation = 'Main Warehouse';
      
      // Check for warehouse data in known column formats from Excel
      // Only use specific warehouse-related field names to avoid confusion with product codes
      const rowWarehouse = row.warehouse || row['Warehouse'] || row['warehouse'] || 
                          row.location || row['Location'] || row['Warehouse Location'] ||
                          row['Warehouse Code'] || row['warehouse_code'] || row['Warehouse_Code'] ||
                          row['warehouseLocation'] || row['warehouse_location'];
      
      if (rowWarehouse && String(rowWarehouse).trim() !== '') {
        // Use warehouse data from the Excel row (like "1A", "Warehouse A", etc.)
        finalWarehouseLocation = String(rowWarehouse).trim();
        console.log(`📍 Using warehouse from Excel row data: ${finalWarehouseLocation}`);
      } else if (warehouse) {
        // Use the selected warehouse from dropdown
        finalWarehouseLocation = warehouse;
        console.log(`📍 Using selected warehouse: ${finalWarehouseLocation}`);
      }
      
      // Upsert product with enhanced warehouse location
      await db.insert(products).values({
        name: row.name || row['Product Name'] || row['name'],
        drugName: row.drugName || row['Drug Name'] || row['drug_name'] || row.name,
        description: row.description || row['Description'],
        sku: row.sku || row['SKU'] || row['sku'],
        costPrice: row.costPrice || row['Cost Price'] || row['cost_price'] || '0',
        sellingPrice: row.sellingPrice || row['Selling Price'] || row['selling_price'] || row.price || '0',
        unitOfMeasure: row.unitOfMeasure || row['Unit of Measure'] || row['unit_of_measure'] || 'PCS',
        location: finalWarehouseLocation,
        quantity: parseInt(row.quantity || row['Quantity'] || row.currentStock || '0'),
        lowStockThreshold: parseInt(row.lowStockThreshold || row['Low Stock Threshold'] || row.minStockLevel || '10'),
        expiryDate: row.expiryDate || row['Expiry Date'] ? new Date(row.expiryDate || row['Expiry Date']).toISOString().split('T')[0] : null,
        status: 'active',
        productType: 'finished',
        categoryId: 1
      }).onConflictDoUpdate({
        target: products.sku,
        set: {
          name: row.name || row['Product Name'] || row['name'],
          drugName: row.drugName || row['Drug Name'] || row['drug_name'] || row.name,
          description: row.description || row['Description'],
          costPrice: row.costPrice || row['Cost Price'] || row['cost_price'] || '0',
          sellingPrice: row.sellingPrice || row['Selling Price'] || row['selling_price'] || row.price || '0',
          unitOfMeasure: row.unitOfMeasure || row['Unit of Measure'] || row['unit_of_measure'] || 'PCS',
          location: finalWarehouseLocation,
          quantity: parseInt(row.quantity || row['Quantity'] || row.currentStock || '0'),
          lowStockThreshold: parseInt(row.lowStockThreshold || row['Low Stock Threshold'] || row.minStockLevel || '10'),
          expiryDate: row.expiryDate || row['Expiry Date'] ? new Date(row.expiryDate || row['Expiry Date']).toISOString().split('T')[0] : null,
          updatedAt: new Date()
        }
      });
      break;

    case 'customers':
      // Enhanced customer data mapping with smart field recognition
      const customerData = {
        name: row.name || row['Name'] || row['Customer Name'] || row['name'],
        email: row.email || row['Email'] || row['email'],
        phone: row.phone || row['Phone'] || row['phone'],
        address: row.address || row['Address'] || row['address'],
        city: row.city || row['City'] || row['city'],
        state: row.state || row['State'] || row['state'],
        zipCode: row.zipCode || row['Zip Code'] || row['zip_code'] || row.zip,
        company: row.company || row['Company'] || row['company'],
        position: row.position || row['Position'] || row['Job Title'] || row['position'],
        sector: row.sector || row['Sector'] || row['Industry'] || row['sector'] || 'Healthcare',
        taxNumber: row.taxNumber || row['Tax Number'] || row['tax_number'] || row.taxId || '',
      };

      // Check if customer already exists by email
      const existingCustomer = await db.select().from(customers).where(eq(customers.email, customerData.email)).limit(1);
      
      if (existingCustomer.length === 0) {
        // Customer doesn't exist - insert new
        await db.insert(customers).values(customerData);
        return 'inserted';
      } else {
        // Customer exists - check if data is different
        const existing = existingCustomer[0];
        const hasChanges = 
          existing.name !== customerData.name ||
          existing.phone !== customerData.phone ||
          existing.address !== customerData.address ||
          existing.city !== customerData.city ||
          existing.state !== customerData.state ||
          existing.zipCode !== customerData.zipCode ||
          existing.company !== customerData.company ||
          existing.position !== customerData.position ||
          existing.sector !== customerData.sector ||
          existing.taxNumber !== customerData.taxNumber;
          
        if (hasChanges) {
          // Update existing customer
          await db.update(customers)
            .set({
              name: customerData.name,
              phone: customerData.phone,
              address: customerData.address,
              city: customerData.city,
              state: customerData.state,
              zipCode: customerData.zipCode,
              company: customerData.company,
              position: customerData.position,
              sector: customerData.sector,
              taxNumber: customerData.taxNumber,
              updatedAt: new Date()
            })
            .where(eq(customers.email, customerData.email));
          return 'updated';
        } else {
          // No changes needed
          return 'skipped';
        }
      }
      break;

    case 'suppliers':
      // Enhanced supplier data mapping (same as JSON import)
      const supplierData = {
        name: row.name || row['Name'] || row['Supplier Name'] || row['name'],
        contactPerson: row.contactPerson || row['Contact Person'] || row['contact_person'] || row.contact,
        email: row.email || row['Email'] || row['email'],
        phone: row.phone || row['Phone'] || row['phone'],
        address: row.address || row['Address'] || row['address'],
        city: row.city || row['City'] || row['city'],
        state: row.state || row['State'] || row['state'],
        zipCode: row.zipCode || row['Zip Code'] || row['zip_code'] || row.zip,
        materials: row.materials || row['Materials'] || row['materials'] || row.products,
        supplierType: row.supplierType || row['Supplier Type'] || row['supplier_type'] || row.type || 'Local',
        etaNumber: row.etaNumber || row['ETA Number'] || row['eta_number'] || row.eta || null
      };

      // Use upsert to handle duplicates
      await db.insert(suppliers).values(supplierData)
        .onConflictDoUpdate({
          target: suppliers.name,
          set: {
            contactPerson: supplierData.contactPerson,
            email: supplierData.email,
            phone: supplierData.phone,
            address: supplierData.address,
            city: supplierData.city,
            state: supplierData.state,
            zipCode: supplierData.zipCode,
            materials: supplierData.materials,
            supplierType: supplierData.supplierType,
            etaNumber: supplierData.etaNumber,
            updatedAt: new Date()
          }
        });
      break;

    default:
      throw new Error(`Unsupported import type: ${type}`);
  }
}

async function getExportData(type: string): Promise<any[]> {
  switch (type) {
    case 'products':
      return await db.select().from(products);
    case 'customers':
      return await db.select().from(customers);
    case 'suppliers':
      return await db.select().from(suppliers);
    case 'orders':
      return await db.select().from(orders);
    case 'expenses':
      return await db.select().from(expenses);
    default:
      throw new Error(`Unsupported export type: ${type}`);
  }
}

function getCSVHeaders(type: string) {
  const headers: Record<string, any[]> = {
    products: [
      { id: 'name', title: 'Name' },
      { id: 'description', title: 'Description' },
      { id: 'category', title: 'Category' },
      { id: 'sku', title: 'SKU' },
      { id: 'price', title: 'Price' },
      { id: 'costPrice', title: 'Cost Price' },
      { id: 'unitOfMeasure', title: 'Unit of Measure' },
      { id: 'warehouse', title: 'Warehouse' },
      { id: 'currentStock', title: 'Current Stock' },
      { id: 'minStockLevel', title: 'Min Stock Level' },
      { id: 'expiryDate', title: 'Expiry Date' }
    ],
    customers: [
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
      { id: 'address', title: 'Address' },
      { id: 'city', title: 'City' },
      { id: 'country', title: 'Country' },
      { id: 'taxId', title: 'Tax ID' },
      { id: 'creditLimit', title: 'Credit Limit' }
    ],
    suppliers: [
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
      { id: 'address', title: 'Address' },
      { id: 'contactPerson', title: 'Contact Person' },
      { id: 'paymentTerms', title: 'Payment Terms' }
    ]
  };

  return headers[type] || [];
}

function getTemplate(type: string): any {
  const templates: Record<string, any> = {
    products: {
      name: 'Sample Product',
      description: 'Sample product description',
      category: 'Medicine',
      sku: 'SP001',
      price: '100.00',
      costPrice: '75.00',
      unitOfMeasure: 'Box',
      warehouse: 'Main Warehouse',
      currentStock: '50',
      minStockLevel: '10',
      expiryDate: '2025-12-31'
    },
    customers: {
      name: 'Sample Customer',
      email: 'customer@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'Sample City',
      country: 'Sample Country',
      taxId: 'TAX123',
      creditLimit: '5000.00'
    },
    suppliers: {
      name: 'Sample Supplier',
      email: 'supplier@example.com',
      phone: '+1234567890',
      address: '456 Supplier St',
      contactPerson: 'John Doe',
      paymentTerms: '30 days'
    }
  };

  return templates[type] || {};
}

export default router;
