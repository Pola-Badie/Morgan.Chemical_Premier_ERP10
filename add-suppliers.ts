import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { suppliers } from './shared/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    || 'postgresql://postgres:postgres@localhost:5432/premier_erp',
});

const db = drizzle(pool);

async function addSuppliers() {
  try {
    console.log('🏭 Adding suppliers to Premier ERP System...\n');

    const supplierData = [
      {
        name: 'Alpha Chemical Industries',
        contactPerson: 'Dr. Sarah Ahmed',
        email: 'sarah.ahmed@alphachem.com',
        phone: '+20-100-555-0101',
        address: '15 Industrial Zone, 6th of October City',
        city: 'Giza',
        state: 'Giza Governorate',
        zipCode: '12566',
        country: 'Egypt',
        taxId: 'TAX-ACI-2024001',
        category: 'Raw Materials',
        status: 'active' as const,
        rating: 5,
        notes: 'Premium supplier for pharmaceutical-grade raw materials. ISO 9001:2015 certified.',
        creditLimit: 500000,
        paymentTerms: 'Net 30',
        website: 'www.alphachem.com'
      },
      {
        name: 'Beta Pharmaceuticals Ltd',
        contactPerson: 'Mr. Mohamed Hassan',
        email: 'mohamed.hassan@betapharma.eg',
        phone: '+20-101-555-0202',
        address: '23 Medical Complex, New Cairo',
        city: 'Cairo',
        state: 'Cairo Governorate',
        zipCode: '11835',
        country: 'Egypt',
        taxId: 'TAX-BPL-2024002',
        category: 'Active Ingredients',
        status: 'active' as const,
        rating: 4,
        notes: 'Specialized in active pharmaceutical ingredients (APIs). GMP certified facility.',
        creditLimit: 750000,
        paymentTerms: 'Net 45',
        website: 'www.betapharma.eg'
      },
      {
        name: 'Global Lab Supplies Co.',
        contactPerson: 'Eng. Fatima El-Sayed',
        email: 'fatima.elsayed@globallabsupplies.com',
        phone: '+20-102-555-0303',
        address: '78 Technology Park, Smart Village',
        city: 'Cairo',
        state: 'Cairo Governorate',
        zipCode: '12577',
        country: 'Egypt',
        taxId: 'TAX-GLS-2024003',
        category: 'Laboratory Equipment',
        status: 'active' as const,
        rating: 5,
        notes: 'Leading supplier of laboratory equipment and consumables. 24/7 technical support.',
        creditLimit: 300000,
        paymentTerms: 'Net 15',
        website: 'www.globallabsupplies.com'
      },
      {
        name: 'Nile Packaging Solutions',
        contactPerson: 'Mr. Ahmed Khalil',
        email: 'ahmed.khalil@nilepack.com',
        phone: '+20-103-555-0404',
        address: '45 Packaging District, 10th of Ramadan City',
        city: 'Sharqia',
        state: 'Sharqia Governorate',
        zipCode: '44629',
        country: 'Egypt',
        taxId: 'TAX-NPS-2024004',
        category: 'Packaging Materials',
        status: 'active' as const,
        rating: 4,
        notes: 'Eco-friendly pharmaceutical packaging solutions. FDA compliant materials.',
        creditLimit: 400000,
        paymentTerms: 'Net 30',
        website: 'www.nilepack.com'
      },
      {
        name: 'Delta Chemical Trading',
        contactPerson: 'Dr. Laila Mahmoud',
        email: 'laila.mahmoud@deltachemical.net',
        phone: '+20-104-555-0505',
        address: '12 Chemical Complex, Alexandria',
        city: 'Alexandria',
        state: 'Alexandria Governorate',
        zipCode: '21511',
        country: 'Egypt',
        taxId: 'TAX-DCT-2024005',
        category: 'Specialty Chemicals',
        status: 'active' as const,
        rating: 5,
        notes: 'Specialized in rare and specialty chemicals. Express delivery available.',
        creditLimit: 250000,
        paymentTerms: 'Net 21',
        website: 'www.deltachemical.net'
      },
      {
        name: 'Premium Safety Equipment LLC',
        contactPerson: 'Ms. Yasmin Farouk',
        email: 'yasmin.farouk@premiumsafety.eg',
        phone: '+20-105-555-0606',
        address: '67 Safety Zone, Nasr City',
        city: 'Cairo',
        state: 'Cairo Governorate',
        zipCode: '11765',
        country: 'Egypt',
        taxId: 'TAX-PSE-2024006',
        category: 'Safety Equipment',
        status: 'active' as const,
        rating: 5,
        notes: 'Complete range of industrial safety equipment. OSHA compliant products.',
        creditLimit: 200000,
        paymentTerms: 'Net 30',
        website: 'www.premiumsafety.eg'
      },
      {
        name: 'Euro-Med Imports',
        contactPerson: 'Mr. Hassan Ali',
        email: 'hassan.ali@euromedimports.com',
        phone: '+20-106-555-0707',
        address: '89 Import Zone, Port Said',
        city: 'Port Said',
        state: 'Port Said Governorate',
        zipCode: '42511',
        country: 'Egypt',
        taxId: 'TAX-EMI-2024007',
        category: 'Import/Export',
        status: 'active' as const,
        rating: 4,
        notes: 'European pharmaceutical imports. Handles all customs clearance.',
        creditLimit: 1000000,
        paymentTerms: 'LC at sight',
        website: 'www.euromedimports.com'
      },
      {
        name: 'Tech Solutions for Pharma',
        contactPerson: 'Eng. Omar Nasser',
        email: 'omar.nasser@techpharm.solutions',
        phone: '+20-107-555-0808',
        address: '34 Tech Hub, Maadi',
        city: 'Cairo',
        state: 'Cairo Governorate',
        zipCode: '11728',
        country: 'Egypt',
        taxId: 'TAX-TSP-2024008',
        category: 'IT & Software',
        status: 'active' as const,
        rating: 5,
        notes: 'Pharmaceutical software and automation solutions. 21 CFR Part 11 compliant systems.',
        creditLimit: 150000,
        paymentTerms: 'Net 30',
        website: 'www.techpharm.solutions'
      },
      {
        name: 'Green Energy Solutions Egypt',
        contactPerson: 'Dr. Amira Zakaria',
        email: 'amira.zakaria@greenenergy.eg',
        phone: '+20-108-555-0909',
        address: '56 Renewable Park, New Administrative Capital',
        city: 'Cairo',
        state: 'Cairo Governorate',
        zipCode: '11865',
        country: 'Egypt',
        taxId: 'TAX-GES-2024009',
        category: 'Utilities & Energy',
        status: 'active' as const,
        rating: 4,
        notes: 'Solar power solutions for pharmaceutical facilities. Energy efficiency consulting.',
        creditLimit: 500000,
        paymentTerms: 'Net 60',
        website: 'www.greenenergy.eg'
      },
      {
        name: 'Quality Assurance Partners',
        contactPerson: 'Ms. Dina Rashad',
        email: 'dina.rashad@qapartners.com',
        phone: '+20-109-555-1010',
        address: '23 Quality Street, Heliopolis',
        city: 'Cairo',
        state: 'Cairo Governorate',
        zipCode: '11757',
        country: 'Egypt',
        taxId: 'TAX-QAP-2024010',
        category: 'Consulting & Services',
        status: 'active' as const,
        rating: 5,
        notes: 'GMP, GDP, and ISO certification consulting. Regulatory compliance experts.',
        creditLimit: 100000,
        paymentTerms: 'Net 15',
        website: 'www.qapartners.com'
      }
    ];

    // Insert suppliers
    const insertedSuppliers = await db.insert(suppliers).values(supplierData).returning();

    console.log(`✅ Successfully added ${insertedSuppliers.length} suppliers\n`);

    // Display summary
    console.log('📊 Supplier Summary:');
    console.log('─'.repeat(50));
    insertedSuppliers.forEach((supplier, index) => {
      console.log(`${index + 1}. ${supplier.name}`);
      console.log(`   Category: ${supplier.category}`);
      console.log(`   Contact: ${supplier.contactPerson} (${supplier.phone})`);
      console.log(`   Credit Limit: $${supplier.creditLimit?.toLocaleString()}`);
      console.log(`   Payment Terms: ${supplier.paymentTerms}`);
      console.log(`   Status: ${supplier.status}`);
      console.log('');
    });

    console.log('✅ All suppliers have been successfully added to the Premier ERP System!');

  } catch (error) {
    console.error('❌ Error adding suppliers:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
addSuppliers();