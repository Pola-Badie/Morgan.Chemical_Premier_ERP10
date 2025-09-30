import { Express, Request, Response } from "express";
import { ProductStorage } from "./storage/product-storage.js";

// Helper functions for chemical data transformation
function getChemicalFormula(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes('aspirin') || name.includes('acetylsalicylic')) return 'C9H8O4';
  if (name.includes('ibuprofen')) return 'C13H18O2';
  if (name.includes('amoxicillin')) return 'C16H19N3O5S';
  if (name.includes('acetaminophen')) return 'C8H9NO2';
  return 'C₁ₓHᵧNᵢOⱼ'; // Generic formula
}

function getProcessingStage(productName: string): string {
  const stages = ['Purification', 'Crystallization', 'Synthesis', 'Filtration', 'Fermentation', 'Precipitation'];
  return stages[Math.floor(Math.random() * stages.length)];
}

export function registerChemicalRoutes(app: Express) {
  // Raw materials endpoint for chemical orders - returns real products from inventory
  app.get("/api/products/raw-materials", async (req: Request, res: Response) => {
    try {
      const productStorage = new ProductStorage();
      
      // Fetch ALL products from the database (not just active ones)
      const allProducts = await productStorage.getProducts();
      
      // Transform products to match expected raw materials format
      const rawMaterials = allProducts.map(product => ({
        id: product.id,
        name: product.name,
        drugName: product.drugName || '',
        sku: product.sku || '',
        unitPrice: parseFloat(product.costPrice) || 0,
        sellingPrice: parseFloat(product.sellingPrice) || 0,
        unit: product.unitOfMeasure || 'units',
        unitOfMeasure: product.unitOfMeasure || 'units',
        currentStock: product.quantity || 0,
        description: product.description || '',
        manufacturer: product.manufacturer || '',
        expiryDate: product.expiryDate,
        grade: product.grade || '',
        productType: product.productType || 'finished'
      }));
      
      console.log(`🔥 RAW MATERIALS: Returning ${rawMaterials.length} products from ALL stock inventory`);
      res.json(rawMaterials);
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      res.status(500).json({ message: "Failed to fetch raw materials from inventory" });
    }
  });
  
  // Semi-finished products endpoint for chemical orders - returns real products from inventory
  app.get("/api/products/semi-finished", async (req: Request, res: Response) => {
    try {
      const productStorage = new ProductStorage();
      
      // Fetch products from the database and transform them as semi-finished products
      const allProducts = await productStorage.getProducts();
      
      // Transform real products to represent semi-finished pharmaceutical products
      const semiFinishedProducts = allProducts
        .filter(product => product.productType === 'finished' && (
          product.name.toLowerCase().includes('aspirin') ||
          product.name.toLowerCase().includes('ibuprofen') ||
          product.name.toLowerCase().includes('amoxicillin') ||
          product.drugName?.toLowerCase().includes('aspirin') ||
          product.drugName?.toLowerCase().includes('ibuprofen') ||
          product.drugName?.toLowerCase().includes('amoxicillin')
        ))
        .slice(0, 10) // Limit to 10 products
        .map(product => ({
          id: product.id,
          name: `${product.name} - API Base`,
          chemicalFormula: getChemicalFormula(product.name),
          purity: "98%",
          unitPrice: parseFloat(product.costPrice) * 0.7, // Base price lower than finished
          unit: "kg",
          stage: getProcessingStage(product.name),
          description: product.description || '',
          grade: product.grade || 'P'
        }));
      
      console.log(`🧪 SEMI-FINISHED: Returning ${semiFinishedProducts.length} semi-finished products from real inventory data`);
      res.json(semiFinishedProducts);
    } catch (error) {
      console.error('Error fetching semi-finished products:', error);
      res.status(500).json({ message: "Failed to fetch semi-finished products from inventory" });
    }
  });
}

export default registerChemicalRoutes;