import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { suppliers } from './shared/schema.ts';

async function addMoreSuppliers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

  });

  try {
    await client.connect();
    const db = drizzle(client);

    const newSuppliers = [
      {
        name: 'Global Pharmaceuticals Ltd',
        contactPerson: 'Dr. Maria Rodriguez',
        email: 'maria.rodriguez@globalpharma.com',
        phone: '+1-555-0123',
        address: '123 Medical Drive',
        city: 'San Francisco',
        state: 'California',
        zipCode: '94102',
        materials: 'Advanced Drug Delivery Systems',
        supplierType: 'International',
        etaNumber: 'ETA123456789'
      },
      {
        name: 'MedTech Solutions Inc',
        contactPerson: 'John Smith',
        email: 'john.smith@medtech.com',
        phone: '+1-555-0234',
        address: '456 Innovation Blvd',
        city: 'Boston',
        state: 'Massachusetts',
        zipCode: '02101',
        materials: 'Medical Equipment, Laboratory Supplies',
        supplierType: 'Domestic',
        etaNumber: 'ETA234567890'
      },
      {
        name: 'BioChemical Enterprises',
        contactPerson: 'Dr. Zhang Wei',
        email: 'zhang.wei@biochem.com',
        phone: '+86-138-0013-8000',
        address: '789 Science Park Road',
        city: 'Shanghai',
        state: 'Shanghai',
        zipCode: '200120',
        materials: 'Biochemical Reagents, Research Chemicals',
        supplierType: 'International',
        etaNumber: 'ETA345678901'
      },
      {
        name: 'European Medicine Supply',
        contactPerson: 'Dr. Hans Mueller',
        email: 'hans.mueller@eumedicine.de',
        phone: '+49-30-12345678',
        address: '321 Pharma Street',
        city: 'Berlin',
        state: 'Berlin',
        zipCode: '10115',
        materials: 'European Pharmaceutical Standards',
        supplierType: 'International',
        etaNumber: 'ETA456789012'
      },
      {
        name: 'Local Chemical Distributors',
        contactPerson: 'Ahmed Al-Mansouri',
        email: 'ahmed@localchem.ae',
        phone: '+971-4-1234567',
        address: '654 Industrial Zone',
        city: 'Dubai',
        state: 'Dubai',
        zipCode: '12345',
        materials: 'Local Chemical Distribution',
        supplierType: 'Regional',
        etaNumber: 'ETA567890123'
      },
      {
        name: 'Advanced Materials Corp',
        contactPerson: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@advmaterials.com',
        phone: '+1-555-0345',
        address: '987 Technology Way',
        city: 'Austin',
        state: 'Texas',
        zipCode: '73301',
        materials: 'Advanced Composite Materials',
        supplierType: 'Domestic',
        etaNumber: null
      },
      {
        name: 'Precision Instruments Ltd',
        contactPerson: 'Michael Chen',
        email: 'michael.chen@precision.com',
        phone: '+1-555-0456',
        address: '147 Precision Avenue',
        city: 'Seattle',
        state: 'Washington',
        zipCode: '98101',
        materials: 'Precision Laboratory Instruments',
        supplierType: 'Domestic',
        etaNumber: null
      }
    ];

    for (const supplier of newSuppliers) {
      await db.insert(suppliers).values(supplier);
      console.log(`✅ Added supplier: ${supplier.name}`);
    }

    console.log(`\n🎉 Successfully added ${newSuppliers.length} new suppliers!`);
    console.log('📊 Total suppliers now available for pagination testing');

  } catch (error) {
    console.error('❌ Error adding suppliers:', error);
  } finally {
    await client.end();
  }
}

addMoreSuppliers();