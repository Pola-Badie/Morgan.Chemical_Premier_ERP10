import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function addMoreProducts() {
  const client = await pool.connect();

  try {
    const products = [
      // Page 2 products (IDs 21-40)
      { name: "Aspirin 325mg", drugName: "Acetylsalicylic Acid", category: "Analgesics", quantity: 500, unitPrice: 8.50, uom: "Tablets", location: "Warehouse 1", shelf: "A-15" },
      { name: "Metformin 850mg", drugName: "Metformin Hydrochloride", category: "Antidiabetics", quantity: 300, unitPrice: 12.75, uom: "Tablets", location: "Warehouse 2", shelf: "B-8" },
      { name: "Atorvastatin 20mg", drugName: "Atorvastatin Calcium", category: "Statins", quantity: 200, unitPrice: 25.30, uom: "Tablets", location: "Central Storage", shelf: "C-12" },
      { name: "Omeprazole 40mg", drugName: "Omeprazole", category: "Proton Pump Inhibitors", quantity: 150, unitPrice: 18.90, uom: "Capsules", location: "Warehouse 1", shelf: "D-5" },
      { name: "Losartan 50mg", drugName: "Losartan Potassium", category: "ARBs", quantity: 400, unitPrice: 15.60, uom: "Tablets", location: "Warehouse 2", shelf: "E-9" },
      { name: "Simvastatin 10mg", drugName: "Simvastatin", category: "Statins", quantity: 250, unitPrice: 11.25, uom: "Tablets", location: "Central Storage", shelf: "F-3" },
      { name: "Furosemide 40mg", drugName: "Furosemide", category: "Diuretics", quantity: 180, unitPrice: 9.75, uom: "Tablets", location: "Warehouse 1", shelf: "G-7" },
      { name: "Gabapentin 300mg", drugName: "Gabapentin", category: "Anticonvulsants", quantity: 120, unitPrice: 22.40, uom: "Capsules", location: "Warehouse 2", shelf: "H-11" },
      { name: "Sertraline 50mg", drugName: "Sertraline Hydrochloride", category: "Antidepressants", quantity: 90, unitPrice: 28.70, uom: "Tablets", location: "Central Storage", shelf: "I-4" },
      { name: "Montelukast 10mg", drugName: "Montelukast Sodium", category: "Leukotriene Inhibitors", quantity: 160, unitPrice: 19.85, uom: "Tablets", location: "Warehouse 1", shelf: "J-6" },
      { name: "Escitalopram 10mg", drugName: "Escitalopram Oxalate", category: "Antidepressants", quantity: 75, unitPrice: 31.20, uom: "Tablets", location: "Warehouse 2", shelf: "K-8" },
      { name: "Pantoprazole 40mg", drugName: "Pantoprazole Sodium", category: "Proton Pump Inhibitors", quantity: 220, unitPrice: 16.50, uom: "Tablets", location: "Central Storage", shelf: "L-10" },
      { name: "Trazodone 50mg", drugName: "Trazodone Hydrochloride", category: "Antidepressants", quantity: 110, unitPrice: 14.90, uom: "Tablets", location: "Warehouse 1", shelf: "M-2" },
      { name: "Meloxicam 15mg", drugName: "Meloxicam", category: "NSAIDs", quantity: 140, unitPrice: 13.60, uom: "Tablets", location: "Warehouse 2", shelf: "N-5" },
      { name: "Cyclobenzaprine 10mg", drugName: "Cyclobenzaprine Hydrochloride", category: "Muscle Relaxants", quantity: 95, unitPrice: 17.30, uom: "Tablets", location: "Central Storage", shelf: "O-7" },
      { name: "Tamsulosin 0.4mg", drugName: "Tamsulosin Hydrochloride", category: "Alpha Blockers", quantity: 85, unitPrice: 24.15, uom: "Capsules", location: "Warehouse 1", shelf: "P-9" },
      { name: "Duloxetine 30mg", drugName: "Duloxetine Hydrochloride", category: "Antidepressants", quantity: 70, unitPrice: 35.80, uom: "Capsules", location: "Warehouse 2", shelf: "Q-3" },
      { name: "Carvedilol 25mg", drugName: "Carvedilol", category: "Beta Blockers", quantity: 130, unitPrice: 12.95, uom: "Tablets", location: "Central Storage", shelf: "R-6" },
      { name: "Ranitidine 150mg", drugName: "Ranitidine Hydrochloride", category: "H2 Blockers", quantity: 200, unitPrice: 8.25, uom: "Tablets", location: "Warehouse 1", shelf: "S-8" },
      { name: "Fluoxetine 20mg", drugName: "Fluoxetine Hydrochloride", category: "Antidepressants", quantity: 115, unitPrice: 18.70, uom: "Capsules", location: "Warehouse 2", shelf: "T-4" },

      // Page 3 products (IDs 41-60)
      { name: "Hydrochlorothiazide 25mg", drugName: "Hydrochlorothiazide", category: "Diuretics", quantity: 350, unitPrice: 7.80, uom: "Tablets", location: "Central Storage", shelf: "U-1" },
      { name: "Prednisone 10mg", drugName: "Prednisone", category: "Corticosteroids", quantity: 180, unitPrice: 11.40, uom: "Tablets", location: "Warehouse 1", shelf: "V-5" },
      { name: "Alprazolam 0.5mg", drugName: "Alprazolam", category: "Benzodiazepines", quantity: 60, unitPrice: 26.90, uom: "Tablets", location: "Warehouse 2", shelf: "W-7" },
      { name: "Clonazepam 1mg", drugName: "Clonazepam", category: "Benzodiazepines", quantity: 45, unitPrice: 22.50, uom: "Tablets", location: "Central Storage", shelf: "X-9" },
      { name: "Tramadol 50mg", drugName: "Tramadol Hydrochloride", category: "Opioid Analgesics", quantity: 90, unitPrice: 15.35, uom: "Tablets", location: "Warehouse 1", shelf: "Y-2" },
      { name: "Methylprednisolone 4mg", drugName: "Methylprednisolone", category: "Corticosteroids", quantity: 125, unitPrice: 19.25, uom: "Tablets", location: "Warehouse 2", shelf: "Z-4" },
      { name: "Buspirone 15mg", drugName: "Buspirone Hydrochloride", category: "Anxiolytics", quantity: 80, unitPrice: 16.75, uom: "Tablets", location: "Central Storage", shelf: "AA-6" },
      { name: "Topiramate 100mg", drugName: "Topiramate", category: "Anticonvulsants", quantity: 65, unitPrice: 29.40, uom: "Tablets", location: "Warehouse 1", shelf: "BB-8" },
      { name: "Venlafaxine 75mg", drugName: "Venlafaxine Hydrochloride", category: "Antidepressants", quantity: 95, unitPrice: 21.80, uom: "Capsules", location: "Warehouse 2", shelf: "CC-3" },
      { name: "Warfarin 5mg", drugName: "Warfarin Sodium", category: "Anticoagulants", quantity: 150, unitPrice: 13.90, uom: "Tablets", location: "Central Storage", shelf: "DD-5" },
      { name: "Clopidogrel 75mg", drugName: "Clopidogrel Bisulfate", category: "Antiplatelet", quantity: 120, unitPrice: 27.65, uom: "Tablets", location: "Warehouse 1", shelf: "EE-7" },
      { name: "Donepezil 10mg", drugName: "Donepezil Hydrochloride", category: "Cholinesterase Inhibitors", quantity: 55, unitPrice: 45.30, uom: "Tablets", location: "Warehouse 2", shelf: "FF-9" },
      { name: "Risperidone 2mg", drugName: "Risperidone", category: "Antipsychotics", quantity: 40, unitPrice: 38.75, uom: "Tablets", location: "Central Storage", shelf: "GG-1" },
      { name: "Quetiapine 100mg", drugName: "Quetiapine Fumarate", category: "Antipsychotics", quantity: 35, unitPrice: 42.20, uom: "Tablets", location: "Warehouse 1", shelf: "HH-4" },
      { name: "Olanzapine 10mg", drugName: "Olanzapine", category: "Antipsychotics", quantity: 30, unitPrice: 51.85, uom: "Tablets", location: "Warehouse 2", shelf: "II-6" },
      { name: "Aripiprazole 15mg", drugName: "Aripiprazole", category: "Antipsychotics", quantity: 25, unitPrice: 68.40, uom: "Tablets", location: "Central Storage", shelf: "JJ-8" },
      { name: "Lamotrigine 100mg", drugName: "Lamotrigine", category: "Anticonvulsants", quantity: 70, unitPrice: 23.95, uom: "Tablets", location: "Warehouse 1", shelf: "KK-2" },
      { name: "Levetiracetam 500mg", drugName: "Levetiracetam", category: "Anticonvulsants", quantity: 85, unitPrice: 18.60, uom: "Tablets", location: "Warehouse 2", shelf: "LL-5" },
      { name: "Phenytoin 100mg", drugName: "Phenytoin Sodium", category: "Anticonvulsants", quantity: 110, unitPrice: 9.85, uom: "Capsules", location: "Central Storage", shelf: "MM-7" },
      { name: "Carbamazepine 200mg", drugName: "Carbamazepine", category: "Anticonvulsants", quantity: 105, unitPrice: 12.30, uom: "Tablets", location: "Warehouse 1", shelf: "NN-9" }
    ];

    for (const product of products) {
      await client.query(`
        INSERT INTO products (name, "drugName", category, quantity, "unitPrice", uom, location, shelf, status, "expiryDate")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', '2025-12-31')
      `, [
        product.name,
        product.drugName,
        product.category,
        product.quantity,
        product.unitPrice,
        product.uom,
        product.location,
        product.shelf
      ]);
    }

    console.log('Successfully added 40 new pharmaceutical products for pagination testing!');
  } catch (error) {
    console.error('Error adding products:', error);
  } finally {
    client.release();
  }
}

addMoreProducts();