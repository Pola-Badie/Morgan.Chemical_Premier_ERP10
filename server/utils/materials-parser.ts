/**
 * Materials parsing utilities for consistent data handling across order management
 */

export interface Material {
  id: number;
  name: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
}

export interface MaterialsData {
  rawMaterials: Material[];
  packagingMaterials: Material[];
}

/**
 * Parse materials from various input formats (string, array, or null)
 */
export function parseMaterials(data: string | Material[] | null | undefined): Material[] {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data.map(normalizeItem);
  }

  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map(normalizeItem) : [];
    } catch (error) {
      console.warn('Failed to parse materials JSON:', error);
      return [];
    }
  }

  return [];
}

/**
 * Normalize material item to ensure consistent data types
 */
function normalizeItem(item: any): Material {
  return {
    id: Number(item.id) || 0,
    name: String(item.name || ''),
    quantity: Number(item.quantity) || 0,
    unitOfMeasure: String(item.unitOfMeasure || ''),
    unitPrice: Number(item.unitPrice) || 0
  };
}

/**
 * Extract materials from order data with multiple possible field names
 */
export function extractOrderMaterials(orderData: any): MaterialsData {
  const rawMaterials = parseMaterials(
    orderData.rawMaterials || orderData.materials
  );
  
  const packagingMaterials = parseMaterials(
    orderData.packagingMaterials || orderData.packaging
  );

  return { rawMaterials, packagingMaterials };
}

/**
 * Calculate total cost from materials array
 */
export function calculateMaterialsCost(materials: Material[]): number {
  return materials.reduce((sum, material) => 
    sum + (material.quantity * material.unitPrice), 0
  );
}

/**
 * Serialize materials for database storage
 */
export function serializeMaterials(materials: Material[]): string | null {
  return materials.length > 0 ? JSON.stringify(materials) : null;
}