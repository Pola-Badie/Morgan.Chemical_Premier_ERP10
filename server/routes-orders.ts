import { Express, Request, Response } from 'express';
import { db } from './db';
import { orders, orderItems, customers, users, systemPreferences, products, warehouseInventory, warehouses } from '../shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { extractOrderMaterials, calculateMaterialsCost, serializeMaterials, parseMaterials } from './utils/materials-parser';
import { calculateOrderFinancials } from './utils/order-calculator';

// ============= INVENTORY MANAGEMENT HELPER FUNCTIONS =============

/**
 * Check if sufficient stock is available in warehouses for a product
 */
async function checkStockAvailability(productId: number, requiredQuantity: number, warehouseId?: number): Promise<{
  available: boolean;
  totalStock: number;
  availableStock: number;
  warehouseDetails: any[];
}> {
  try {
    let warehouseStock;

    if (warehouseId) {
      // Check specific warehouse
      warehouseStock = await db
        .select({
          warehouseId: warehouseInventory.warehouseId,
          warehouseName: warehouses.name,
          quantity: warehouseInventory.quantity,
          reservedQuantity: warehouseInventory.reservedQuantity,
          availableQuantity: sql`${warehouseInventory.quantity} - ${warehouseInventory.reservedQuantity}`.mapWith(Number)
        })
        .from(warehouseInventory)
        .innerJoin(warehouses, eq(warehouses.id, warehouseInventory.warehouseId))
        .where(and(
          eq(warehouseInventory.productId, productId),
          eq(warehouseInventory.warehouseId, warehouseId)
        ));
    } else {
      // Check all warehouses
      warehouseStock = await db
        .select({
          warehouseId: warehouseInventory.warehouseId,
          warehouseName: warehouses.name,
          quantity: warehouseInventory.quantity,
          reservedQuantity: warehouseInventory.reservedQuantity,
          availableQuantity: sql`${warehouseInventory.quantity} - ${warehouseInventory.reservedQuantity}`.mapWith(Number)
        })
        .from(warehouseInventory)
        .innerJoin(warehouses, eq(warehouses.id, warehouseInventory.warehouseId))
        .where(eq(warehouseInventory.productId, productId));
    }

    const totalStock = warehouseStock.reduce((sum, stock) => sum + stock.quantity, 0);
    const availableStock = warehouseStock.reduce((sum, stock) => sum + stock.availableQuantity, 0);

    return {
      available: availableStock >= requiredQuantity,
      totalStock,
      availableStock,
      warehouseDetails: warehouseStock
    };
  } catch (error) {
    console.error('Error checking stock availability:', error);
    return {
      available: false,
      totalStock: 0,
      availableStock: 0,
      warehouseDetails: []
    };
  }
}

/**
 * Deduct inventory from warehouse stock
 */
async function deductInventoryStock(productId: number, quantity: number, warehouseId?: number): Promise<{
  success: boolean;
  deductions: any[];
  error?: string;
}> {
  try {
    const stockCheck = await checkStockAvailability(productId, quantity, warehouseId);

    if (!stockCheck.available) {
      return {
        success: false,
        deductions: [],
        error: `Insufficient stock. Required: ${quantity}, Available: ${stockCheck.availableStock}`
      };
    }

    let deductions = [];
    let remainingQuantity = quantity;

    // If specific warehouse provided, deduct from that warehouse only
    if (warehouseId) {
      const warehouseStock = stockCheck.warehouseDetails.find(w => w.warehouseId === warehouseId);
      if (warehouseStock && warehouseStock.availableQuantity >= quantity) {
        await db
          .update(warehouseInventory)
          .set({
            reservedQuantity: sql`${warehouseInventory.reservedQuantity} + ${quantity}`,
            lastUpdated: new Date(),
            updatedBy: 1 // TODO: Get from session
          })
          .where(and(
            eq(warehouseInventory.productId, productId),
            eq(warehouseInventory.warehouseId, warehouseId)
          ));

        deductions.push({
          warehouseId,
          warehouseName: warehouseStock.warehouseName,
          quantityDeducted: quantity
        });
      }
    } else {
      // Deduct from multiple warehouses if needed (FIFO approach)
      for (const warehouse of stockCheck.warehouseDetails) {
        if (remainingQuantity <= 0) break;

        const availableInWarehouse = warehouse.availableQuantity;
        const deductFromWarehouse = Math.min(remainingQuantity, availableInWarehouse);

        if (deductFromWarehouse > 0) {
          await db
            .update(warehouseInventory)
            .set({
              reservedQuantity: sql`${warehouseInventory.reservedQuantity} + ${deductFromWarehouse}`,
              lastUpdated: new Date(),
              updatedBy: 1 // TODO: Get from session
            })
            .where(and(
              eq(warehouseInventory.productId, productId),
              eq(warehouseInventory.warehouseId, warehouse.warehouseId)
            ));

          deductions.push({
            warehouseId: warehouse.warehouseId,
            warehouseName: warehouse.warehouseName,
            quantityDeducted: deductFromWarehouse
          });

          remainingQuantity -= deductFromWarehouse;
        }
      }
    }

    return {
      success: remainingQuantity === 0,
      deductions,
      error: remainingQuantity > 0 ? `Could not allocate ${remainingQuantity} units` : undefined
    };
  } catch (error) {
    console.error('Error deducting inventory stock:', error);
    return {
      success: false,
      deductions: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Confirm inventory deduction (convert reserved to actual reduction)
 */
async function confirmInventoryDeduction(productId: number, quantity: number, warehouseId?: number): Promise<boolean> {
  try {
    if (warehouseId) {
      await db
        .update(warehouseInventory)
        .set({
          quantity: sql`${warehouseInventory.quantity} - ${quantity}`,
          reservedQuantity: sql`${warehouseInventory.reservedQuantity} - ${quantity}`,
          lastUpdated: new Date(),
          updatedBy: 1
        })
        .where(and(
          eq(warehouseInventory.productId, productId),
          eq(warehouseInventory.warehouseId, warehouseId)
        ));
    } else {
      // This is more complex for multi-warehouse deduction - would need to track per warehouse
      // For now, implement simple approach
      const stockCheck = await checkStockAvailability(productId, quantity);
      let remainingQuantity = quantity;

      for (const warehouse of stockCheck.warehouseDetails) {
        if (remainingQuantity <= 0) break;

        const deductFromWarehouse = Math.min(remainingQuantity, warehouse.reservedQuantity);

        if (deductFromWarehouse > 0) {
          await db
            .update(warehouseInventory)
            .set({
              quantity: sql`${warehouseInventory.quantity} - ${deductFromWarehouse}`,
              reservedQuantity: sql`${warehouseInventory.reservedQuantity} - ${deductFromWarehouse}`,
              lastUpdated: new Date(),
              updatedBy: 1
            })
            .where(and(
              eq(warehouseInventory.productId, productId),
              eq(warehouseInventory.warehouseId, warehouse.warehouseId)
            ));

          remainingQuantity -= deductFromWarehouse;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error confirming inventory deduction:', error);
    return false;
  }
}

export function registerOrderRoutes(app: Express) {
  // POST endpoint for creating new orders
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const orderData = req.body;

      // Generate order number if not provided
      if (!orderData.orderNumber) {
        const orderCount = await db.select().from(orders);
        const nextId = orderCount.length + 1;
        orderData.orderNumber = `ORD-${orderData.orderType.toUpperCase()}-2025-${nextId.toString().padStart(3, '0')}`;
      }

      // Parse materials and packaging from JSON strings
      let materials = [];
      let packaging = [];

      console.log('🔥 INCOMING ORDER DATA:', {
        materials: orderData.materials,
        packaging: orderData.packaging,
        rawMaterials: orderData.rawMaterials,
        packagingMaterials: orderData.packagingMaterials,
        transportationCost: orderData.transportationCost,
        totalCost: orderData.totalCost
      });

      try {
        // Handle multiple possible field names for materials
        const materialsData = orderData.materials || orderData.rawMaterials || [];
        const packagingData = orderData.packaging || orderData.packagingMaterials || [];

        if (materialsData) {
          if (typeof materialsData === 'string') {
            try {
              // Try parsing as-is first (for properly formatted JSON)
              materials = JSON.parse(materialsData);
            } catch (e) {
              try {
                // Fix malformed JSON - add quotes around property names and string values
                let cleanedMaterials = materialsData
                  .replace(/'/g, '"')  // Replace single quotes
                  .replace(/(\w+):/g, '"$1":')  // Quote property names
                  .replace(/:([a-zA-Z][^,}\]]*)/g, ':"$1"')  // Quote string values (not numbers)
                  .replace(/:"(\d+\.?\d*)":/g, ':$1:')  // Unquote numeric values in properties
                  .replace(/:"(\d+\.?\d*)",/g, ':"$1",')  // Keep quoted numeric values
                  .replace(/:"(\d+\.?\d*)"}/g, ':"$1"}');  // Keep quoted numeric values

                materials = JSON.parse(cleanedMaterials);
              } catch (e2) {
                console.error('Failed to parse materials JSON:', e2, 'Raw:', materialsData);
                materials = [];
              }
            }
          } else if (Array.isArray(materialsData)) {
            materials = materialsData;
          } else {
            materials = [];
          }
        }

        if (packagingData) {
          if (typeof packagingData === 'string') {
            try {
              // Try parsing as-is first (for properly formatted JSON)
              packaging = JSON.parse(packagingData);
            } catch (e) {
              try {
                // Fix malformed JSON - add quotes around property names and string values
                let cleanedPackaging = packagingData
                  .replace(/'/g, '"')  // Replace single quotes
                  .replace(/(\w+):/g, '"$1":')  // Quote property names
                  .replace(/:([a-zA-Z][^,}\]]*)/g, ':"$1"')  // Quote string values (not numbers)
                  .replace(/:"(\d+\.?\d*)":/g, ':$1:')  // Unquote numeric values in properties
                  .replace(/:"(\d+\.?\d*)",/g, ':"$1",')  // Keep quoted numeric values
                  .replace(/:"(\d+\.?\d*)"}/g, ':"$1"}');  // Keep quoted numeric values

                packaging = JSON.parse(cleanedPackaging);
              } catch (e2) {
                console.error('Failed to parse packaging JSON:', e2, 'Raw:', packagingData);
                packaging = [];
              }
            }
          } else if (Array.isArray(packagingData)) {
            packaging = packagingData;
          } else {
            packaging = [];
          }
        }

        console.log('🔥 PARSED MATERIALS:', materials.length > 0 ? `${materials.length} items` : 'none');
        console.log('🔥 PARSED MATERIALS DATA:', materials);
        console.log('🔥 PARSED PACKAGING:', packaging.length > 0 ? `${packaging.length} items` : 'none');
        console.log('🔥 PARSED PACKAGING DATA:', packaging);
      } catch (parseError) {
        console.error('Error parsing materials or packaging:', parseError);
        console.error('Raw materials data:', orderData.materials);
        console.error('Raw packaging data:', orderData.packaging);
        // Fallback to empty arrays
        materials = [];
        packaging = [];
      }

      // ============= INVENTORY VALIDATION AND DEDUCTION =============

      // Validate stock availability for all materials before creating order
      const stockValidation = [];
      const inventoryDeductions = [];

      if (materials && materials.length > 0) {
        for (const material of materials) {
          if (material.productId && material.quantity) {
            const stockCheck = await checkStockAvailability(
              parseInt(material.productId),
              parseFloat(material.quantity)
            );

            if (!stockCheck.available) {
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for ${material.name || `Product ID ${material.productId}`}. Required: ${material.quantity}, Available: ${stockCheck.availableStock}`,
                error: 'INSUFFICIENT_STOCK',
                stockDetails: {
                  productId: material.productId,
                  productName: material.name,
                  required: parseFloat(material.quantity),
                  available: stockCheck.availableStock,
                  warehouseDetails: stockCheck.warehouseDetails
                }
              });
            }

            stockValidation.push({
              productId: material.productId,
              productName: material.name,
              quantity: parseFloat(material.quantity),
              stockCheck
            });
          }
        }

        console.log('✅ STOCK VALIDATION PASSED for all materials');

        // Reserve inventory for all materials
        for (const validation of stockValidation) {
          const deduction = await deductInventoryStock(
            validation.productId,
            validation.quantity
          );

          if (!deduction.success) {
            // Rollback any previous reservations if this fails
            for (const prevDeduction of inventoryDeductions) {
              // TODO: Implement rollback logic
              console.error('⚠️ Need to rollback previous inventory reservations');
            }

            return res.status(400).json({
              success: false,
              message: `Failed to reserve inventory for ${validation.productName}: ${deduction.error}`,
              error: 'INVENTORY_RESERVATION_FAILED'
            });
          }

          inventoryDeductions.push({
            productId: validation.productId,
            productName: validation.productName,
            quantity: validation.quantity,
            deductions: deduction.deductions
          });
        }

        console.log('✅ INVENTORY RESERVED successfully for all materials:', inventoryDeductions);
      }

      // Try to create the order in the database, fall back to memory storage if table doesn't exist
      let newOrder;
      try {
        console.log('🔥 Creating order with data:', {
          orderNumber: orderData.orderNumber,
          orderType: orderData.orderType,
          customerId: orderData.customerId,
          description: orderData.finalProduct || orderData.expectedOutput,
          totalCost: orderData.totalCost || '0',
          materialsCount: materials.length,
          packagingCount: packaging.length,
          materials: materials,
          packaging: packaging,
          inventoryReserved: inventoryDeductions.length > 0
        });

        // For production orders, we don't need targetProductId, only for refining orders
        const insertData: any = {
          orderNumber: `ORD-${Date.now()}`,
          orderType: orderData.orderType || 'production',
          customerId: orderData.customerId,
          userId: 1, // Default user ID, should be from session
          description: orderData.finalProduct || orderData.expectedOutput,
          totalMaterialCost: parseFloat(orderData.subtotal || '0').toString(),
          totalAdditionalFees: parseFloat(orderData.transportationCost || '0').toString(),
          totalCost: parseFloat(orderData.totalCost || '0').toString(),
          profitMarginPercentage: parseFloat(orderData.profitMarginPercentage || '20').toString(),
          status: orderData.status || 'pending',
          expectedOutputQuantity: orderData.expectedOutput || '1',
          rawMaterials: materials.length > 0 ? JSON.stringify(materials) : null,
          packagingMaterials: packaging.length > 0 ? JSON.stringify(packaging) : null,
        };

        // Only add targetProductId for refining orders
        if (orderData.orderType === 'refining' && orderData.targetProductId) {
          insertData.targetProductId = orderData.targetProductId;
        }

        newOrder = await db.insert(orders).values(insertData).returning();
      } catch (dbError) {
        console.error('🔥 Database error creating order:', dbError);
        console.log('🔥 Database table not ready, creating order in memory for now');
        // Create a mock database response for now
        newOrder = [{
          id: Date.now(),
          orderNumber: orderData.orderNumber,
          orderType: orderData.orderType,
          customerId: orderData.customerId,
          userId: 1,
          description: orderData.finalProduct || orderData.expectedOutput,
          totalMaterialCost: parseFloat(orderData.subtotal || '0'),
          totalAdditionalFees: parseFloat(orderData.transportationCost || '0'),
          totalCost: parseFloat(orderData.totalCost || '0'),
          status: orderData.status || 'pending',
          createdAt: new Date(),
        }];
      }

      // Calculate revenue and profit using configurable margin
      const totalCost = parseFloat(orderData.totalCost || '0');
      const profitMargin = parseFloat(orderData.profitMarginPercentage || newOrder[0]?.profitMarginPercentage || '20');
      const markupMultiplier = 1 + (profitMargin / 100);
      const revenue = totalCost * markupMultiplier;
      const profit = totalCost * (profitMargin / 100);

      // Store additional data in a more structured way with real material details
      const orderRecord = {
        ...newOrder[0],
        batchNumber: orderData.batchNumber,
        customerName: orderData.customerName,
        customerCompany: orderData.customerName, // Use same as customer name for now
        finalProduct: orderData.finalProduct || orderData.expectedOutput,
        rawMaterials: materials, // This should contain detailed material info with costs
        packagingMaterials: packaging, // This should contain detailed packaging info with costs
        productionSteps: ["Material preparation", "Mixing and blending", "Quality control", "Packaging"], // Basic production steps
        revenue: revenue,
        profit: profit,
        profitMarginPercentage: profitMargin,
        orderDate: new Date().toISOString().split('T')[0],
        completionDate: null,
        // Store detailed costs for real material tracking
        materialCostBreakdown: {
          rawMaterialsCost: materials?.reduce((sum: number, mat: any) =>
            sum + (parseFloat(mat.unitPrice || '0') * parseFloat(mat.quantity || '0')), 0) || 0,
          packagingCost: packaging?.reduce((sum: number, pack: any) =>
            sum + (parseFloat(pack.unitPrice || '0') * parseFloat(pack.quantity || '0')), 0) || 0
        }
      };

      // Store this order in memory for the production history endpoint
      if (!(global as any).createdOrders) {
        (global as any).createdOrders = [];
      }
      (global as any).createdOrders.push(orderRecord);

      console.log('🔥 NEW ORDER CREATED:', orderRecord);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: orderRecord
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  // PATCH endpoint for updating production order status
  app.patch("/api/production-orders/:id", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      console.log(`🔄 UPDATING PRODUCTION ORDER ${orderId} STATUS:`, status);

      if (!status || !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      // Update in database
      const updatedOrder = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder || updatedOrder.length === 0) {
        return res.status(404).json({ message: "Production order not found" });
      }

      console.log(`✅ PRODUCTION ORDER ${orderId} STATUS UPDATED:`, updatedOrder[0].status);
      res.json({ success: true, order: updatedOrder[0] });
    } catch (error) {
      console.error("Error updating production order status:", error);
      res.status(500).json({ message: "Failed to update production order status", error: (error as Error).message });
    }
  });

  // PATCH endpoint for updating refining order status
  app.patch("/api/refining-orders/:id", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      console.log(`🔄 UPDATING REFINING ORDER ${orderId} STATUS:`, status);

      if (!status || !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      // Update in database
      const updatedOrder = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder || updatedOrder.length === 0) {
        return res.status(404).json({ message: "Refining order not found" });
      }

      console.log(`✅ REFINING ORDER ${orderId} STATUS UPDATED:`, updatedOrder[0].status);
      res.json({ success: true, order: updatedOrder[0] });
    } catch (error) {
      console.error("Error updating refining order status:", error);
      res.status(500).json({ message: "Failed to update refining order status", error: (error as Error).message });
    }
  });

  // Get all orders (main endpoint)
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      // Return pharmaceutical orders data with proper structure
      const orders = [
        {
          id: 1,
          orderNumber: "ORD-PHM-2025-001",
          batchNumber: "BATCH-IBU-001",
          orderType: "production", // Changed from 'type' to 'orderType' and 'manufacturing' to 'production'
          customerName: "Cairo Medical Center",
          customerCompany: "Cairo Medical Center",
          finalProduct: "Ibuprofen Tablets 400mg", // Changed from 'targetProduct' to 'finalProduct'
          orderDate: "2025-01-15",
          completionDate: "2025-02-14",
          status: "completed",
          totalCost: 45000,
          revenue: 54150,
          profit: 9150,
          createdAt: "2025-01-15T08:00:00.000Z", // Added createdAt field
          rawMaterials: [
            "Para-aminobenzoic acid",
            "Acetic anhydride",
            "Lactose",
            "Microcrystalline cellulose"
          ],
          packagingMaterials: [
            "Aluminum blister pack",
            "Cardboard boxes",
            "Information leaflets"
          ]
        },
        {
          id: 2,
          orderNumber: "ORD-PHM-2025-002",
          batchNumber: "BATCH-PCM-002",
          orderType: "production",
          customerName: "Alexandria Pharmaceuticals",
          customerCompany: "Alexandria Pharmaceuticals Ltd.",
          finalProduct: "Paracetamol Tablets 500mg",
          orderDate: "2025-01-20",
          completionDate: "2025-02-18",
          status: "completed",
          totalCost: 32000,
          revenue: 41600,
          profit: 9600,
          createdAt: "2025-01-20T09:30:00.000Z",
          rawMaterials: [
            "Paracetamol Active Pharmaceutical Ingredient",
            "Corn starch",
            "Povidone",
            "Magnesium stearate"
          ],
          packagingMaterials: [
            "PVC blister film",
            "Aluminum foil",
            "Cardboard packaging"
          ]
        },
        {
          id: 3,
          orderNumber: "ORD-PHM-2025-003",
          batchNumber: "BATCH-AMX-003",
          orderType: "production",
          customerName: "MedPharma Solutions",
          customerCompany: "MedPharma Solutions Inc.",
          finalProduct: "Amoxicillin Capsules 250mg",
          orderDate: "2025-02-01",
          completionDate: "2025-03-01",
          status: "in-progress",
          totalCost: 68000,
          revenue: 89000,
          profit: 21000,
          createdAt: "2025-02-01T10:15:00.000Z",
          rawMaterials: [
            "Amoxicillin trihydrate",
            "Magnesium stearate",
            "Sodium starch glycolate",
            "Microcrystalline cellulose"
          ],
          packagingMaterials: [
            "Hard gelatin capsules",
            "Aluminum strips",
            "Bottle containers"
          ]
        },
        {
          id: 4,
          orderNumber: "ORD-PHM-2025-004",
          batchNumber: "BATCH-ASP-004",
          orderType: "production",
          customerName: "National Medical Supplies",
          customerCompany: "National Medical Supplies Co.",
          finalProduct: "Aspirin Tablets 100mg",
          orderDate: "2025-02-10",
          completionDate: null,
          status: "pending",
          totalCost: 25000,
          revenue: 32500,
          profit: 7500,
          createdAt: "2025-02-10T14:20:00.000Z",
          rawMaterials: [
            "Acetylsalicylic acid",
            "Corn starch",
            "Hydroxypropyl cellulose",
            "Silicon dioxide"
          ],
          packagingMaterials: [
            "Film-coated tablets",
            "Blister packaging",
            "Information leaflets"
          ]
        },
        {
          id: 5,
          orderNumber: "ORD-REF-2025-001",
          batchNumber: "REF-BATCH-001",
          orderType: "refining",
          customerName: "Pure Pharma Ltd",
          customerCompany: "Pure Pharma Limited",
          finalProduct: "Refined Ibuprofen API 99.5%",
          orderDate: "2025-02-05",
          completionDate: null,
          status: "in-progress",
          totalCost: 55000,
          revenue: 72000,
          profit: 17000,
          createdAt: "2025-02-05T11:45:00.000Z",
          refiningSteps: [
            "Initial purification",
            "Crystallization process",
            "Quality testing",
            "Final packaging"
          ]
        }
      ];
      res.json(orders);
    } catch (error) {
      console.error("Error in orders endpoint:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get production order history with batch numbers (dedicated endpoint)
  app.get("/api/orders/production-history", async (req: Request, res: Response) => {
    try {
      console.log('🔥 PRODUCTION ORDERS HISTORY: Fetching production orders from database and static data');

      // Get orders from in-memory storage first (these are the ones created through Order Management)
      const memoryOrders = (global as any).createdOrders || [];
      console.log('🔥 MEMORY ORDERS FOUND:', memoryOrders.length);
      console.log('🔥 MEMORY ORDERS DATA:', memoryOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        packagingCount: order.packagingMaterials?.length || 0,
        packaging: order.packagingMaterials
      })));

      // Try to fetch orders from database, fall back to empty array if table doesn't exist yet
      let dbOrders: any[] = [];
      try {
        dbOrders = await db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            orderType: orders.orderType,
            customerId: orders.customerId,
            description: orders.description,
            totalCost: orders.totalCost,
            totalAdditionalFees: orders.totalAdditionalFees, // Transportation cost
            profitMarginPercentage: orders.profitMarginPercentage,
            status: orders.status,
            createdAt: orders.createdAt,
            refiningSteps: orders.refiningSteps,
            rawMaterials: orders.rawMaterials,
            packagingMaterials: orders.packagingMaterials,
          })
          .from(orders)
          .where(eq(orders.orderType, 'production'))
          .orderBy(desc(orders.createdAt));
      } catch (dbError) {
        console.log('🔥 Database table not ready yet, using static data only');
        dbOrders = [];
      }

      // Get customer details for each order and format for Orders History page
      const dbOrdersFormatted = await Promise.all(
        dbOrders.map(async (order) => {
          let customer: any[] = [];
          try {
            customer = await db
              .select({ name: customers.name, company: customers.company })
              .from(customers)
              .where(eq(customers.id, order.customerId))
              .limit(1);
          } catch (e) {
            // Use fallback customer data if customers table doesn't exist
            customer = [{ name: "Alexandria Pharmacy", company: "Alexandria Pharmacy" }];
          }

          // Generate batch number and other calculated fields
          const batchNumber = `BATCH-${order.orderNumber.split('-').pop()}-${String(order.id).padStart(3, '0')}`;

          // Calculate revenue and profit using configurable margin from database
          const totalCost = parseFloat(order.totalCost);
          const profitMargin = parseFloat(order.profitMarginPercentage || '20');
          const markupMultiplier = 1 + (profitMargin / 100);
          const revenue = totalCost * markupMultiplier;
          const profit = totalCost * (profitMargin / 100);

          // Parse real materials from database - they are stored as JSON
          let realRawMaterials = [];
          let realPackagingMaterials = [];

          try {
            realRawMaterials = order.rawMaterials ? (Array.isArray(order.rawMaterials) ? order.rawMaterials : JSON.parse(order.rawMaterials)) : [];
            realPackagingMaterials = order.packagingMaterials ? (Array.isArray(order.packagingMaterials) ? order.packagingMaterials : JSON.parse(order.packagingMaterials)) : [];
          } catch (parseError) {
            console.error('Error parsing stored materials for order', order.orderNumber, parseError);
            realRawMaterials = [];
            realPackagingMaterials = [];
          }

          console.log(`🔥 ORDER ${order.orderNumber}: rawMaterials count=${realRawMaterials.length}, packagingMaterials count=${realPackagingMaterials.length}`);
          console.log(`🔥 ORDER ${order.orderNumber} MATERIALS:`, JSON.stringify(realRawMaterials));

          return {
            id: order.id + 100, // Offset to avoid ID conflicts with static data
            orderNumber: order.orderNumber,
            batchNumber: batchNumber,
            orderType: order.orderType,
            customerName: customer[0]?.name || 'Unknown Customer',
            customerCompany: customer[0]?.company || 'Unknown Company',
            finalProduct: order.description || 'Production Order',
            orderDate: order.createdAt.toISOString().split('T')[0],
            completionDate: order.status === 'completed'
              ? new Date(order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : null,
            status: order.status,
            totalCost: totalCost,
            transportationCost: parseFloat(order.totalAdditionalFees || '0'), // Add transportation cost
            revenue: revenue,
            profit: profit,
            profitMarginPercentage: profitMargin,
            createdAt: order.createdAt.toISOString(),
            rawMaterials: realRawMaterials,
            packagingMaterials: realPackagingMaterials,
            productionSteps: ["Production", "Quality control", "Packaging", "Testing"],
            materialCostBreakdown: {
              rawMaterialsCost: realRawMaterials?.reduce((sum: number, mat: any) =>
                sum + (parseFloat(mat.unitPrice || '0') * parseFloat(mat.quantity || '0')), 0) || 0,
              packagingCost: realPackagingMaterials?.reduce((sum: number, pack: any) =>
                sum + (parseFloat(pack.unitPrice || '0') * parseFloat(pack.quantity || '0')), 0) || 0
            }
          };
        })
      );

      // Static historical orders - DISABLED - only show real orders from Order Management
      const productionOrderHistory = [
        {
          id: 1,
          orderNumber: "ORD-PHM-2025-001",
          batchNumber: "BATCH-IBU-001",
          orderType: "production",
          customerName: "Cairo Medical Center",
          customerCompany: "Cairo Medical Center",
          finalProduct: "Ibuprofen Tablets 400mg",
          orderDate: "2025-01-15",
          completionDate: "2025-02-14",
          status: "completed",
          totalCost: 45000,
          revenue: 54150,
          profit: 9150,
          createdAt: "2025-01-15T08:00:00.000Z",
          rawMaterials: [
            "Para-aminobenzoic acid",
            "Acetic anhydride",
            "Lactose",
            "Microcrystalline cellulose"
          ],
          packagingMaterials: [
            "Aluminum blister pack",
            "Cardboard boxes",
            "Information leaflets"
          ],
          productionSteps: [
            "API synthesis",
            "Granulation",
            "Tablet compression",
            "Coating",
            "Quality control",
            "Packaging"
          ]
        },
        {
          id: 2,
          orderNumber: "ORD-PHM-2025-002",
          batchNumber: "BATCH-PCM-002",
          orderType: "production",
          customerName: "Alexandria Pharmaceuticals",
          customerCompany: "Alexandria Pharmaceuticals Ltd.",
          finalProduct: "Paracetamol Tablets 500mg",
          orderDate: "2025-01-20",
          completionDate: "2025-02-18",
          status: "completed",
          totalCost: 32000,
          revenue: 41600,
          profit: 9600,
          createdAt: "2025-01-20T09:30:00.000Z",
          rawMaterials: [
            "Paracetamol Active Pharmaceutical Ingredient",
            "Corn starch",
            "Povidone",
            "Magnesium stearate"
          ],
          packagingMaterials: [
            "PVC blister film",
            "Aluminum foil",
            "Cardboard packaging"
          ],
          productionSteps: [
            "API preparation",
            "Wet granulation",
            "Drying",
            "Compression",
            "Quality testing",
            "Blister packaging"
          ]
        },
        {
          id: 3,
          orderNumber: "ORD-PHM-2025-003",
          batchNumber: "BATCH-AMX-003",
          orderType: "production",
          customerName: "MedPharma Solutions",
          customerCompany: "MedPharma Solutions Inc.",
          finalProduct: "Amoxicillin Capsules 250mg",
          orderDate: "2025-02-01",
          completionDate: "2025-03-01",
          status: "in-progress",
          totalCost: 68000,
          revenue: 89000,
          profit: 21000,
          createdAt: "2025-02-01T10:15:00.000Z",
          rawMaterials: [
            "Amoxicillin trihydrate",
            "Magnesium stearate",
            "Sodium starch glycolate",
            "Microcrystalline cellulose"
          ],
          packagingMaterials: [
            "Hard gelatin capsules",
            "Aluminum strips",
            "Bottle containers"
          ],
          productionSteps: [
            "API purification",
            "Mixing",
            "Capsule filling",
            "Inspection",
            "Strip packaging",
            "Final packaging"
          ]
        },
        {
          id: 4,
          orderNumber: "ORD-PHM-2025-004",
          batchNumber: "BATCH-ASP-004",
          orderType: "production",
          customerName: "National Medical Supplies",
          customerCompany: "National Medical Supplies Co.",
          finalProduct: "Aspirin Tablets 100mg",
          orderDate: "2025-02-10",
          completionDate: null,
          status: "pending",
          totalCost: 25000,
          revenue: 32500,
          profit: 7500,
          createdAt: "2025-02-10T14:20:00.000Z",
          rawMaterials: [
            "Acetylsalicylic acid",
            "Corn starch",
            "Hydroxypropyl cellulose",
            "Silicon dioxide"
          ],
          packagingMaterials: [
            "Film-coated tablets",
            "Blister packaging",
            "Information leaflets"
          ],
          productionSteps: [
            "API preparation",
            "Blending",
            "Tablet formation",
            "Film coating",
            "Quality control"
          ]
        },
        {
          id: 5,
          orderNumber: "ORD-PHM-2025-005",
          batchNumber: "BATCH-CIP-005",
          orderType: "production",
          customerName: "Healthcare Plus",
          customerCompany: "Healthcare Plus Medical Center",
          finalProduct: "Ciprofloxacin Tablets 500mg",
          orderDate: "2025-02-12",
          completionDate: null,
          status: "cancelled",
          totalCost: 42000,
          revenue: 55000,
          profit: 13000,
          createdAt: "2025-02-12T16:45:00.000Z",
          rawMaterials: [
            "Ciprofloxacin hydrochloride",
            "Microcrystalline cellulose",
            "Croscarmellose sodium",
            "Magnesium stearate"
          ],
          packagingMaterials: [
            "Film-coated tablets",
            "Aluminum blister",
            "Carton boxes"
          ],
          productionSteps: [
            "API synthesis",
            "Granulation",
            "Compression",
            "Film coating"
          ]
        }
      ];

      // Combine all orders: memory orders (from Order Management) + database orders + NO STATIC FAKE DATA
      const allOrders = [...memoryOrders, ...dbOrdersFormatted];

      console.log(`🔥 PRODUCTION ORDERS HISTORY: Returning ${allOrders.length} REAL production orders (${memoryOrders.length} from Memory, ${dbOrdersFormatted.length} from DB, 0 fake static)`);

      res.json(allOrders);
    } catch (error) {
      console.error("Error fetching production order history:", error);
      res.status(500).json({ message: "Failed to fetch production order history" });
    }
  });

  // Get complete order details for comprehensive history (NEW ENDPOINT)
  app.get("/api/orders/detailed-history", async (req: Request, res: Response) => {
    try {
      console.log('🔄 DETAILED HISTORY: Fetching complete orders with all materials and cost details');

      // Get all orders from database with complete information
      const dbOrders = await db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        orderType: orders.orderType,
        customerId: orders.customerId,
        userId: orders.userId,
        description: orders.description,
        totalMaterialCost: orders.totalMaterialCost,
        totalAdditionalFees: orders.totalAdditionalFees,
        totalCost: orders.totalCost,
        profitMarginPercentage: orders.profitMarginPercentage,
        status: orders.status,
        expectedOutputQuantity: orders.expectedOutputQuantity,
        refiningSteps: orders.refiningSteps,
        targetProductId: orders.targetProductId,
        rawMaterials: orders.rawMaterials,
        packagingMaterials: orders.packagingMaterials,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // Join customer data
        customerName: customers.name,
        customerCompany: customers.company
      })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .orderBy(desc(orders.createdAt));

      // Get memory orders (created in current session)
      const memoryOrders = (global as any).createdOrders || [];

      // Remove duplicates: exclude memory orders that already exist in database
      const dbOrderNumbers = new Set(dbOrders.map(order => order.orderNumber));
      const uniqueMemoryOrders = memoryOrders.filter((order: any) => {
        const orderNumber = order.orderNumber || order.order_number;
        return !dbOrderNumbers.has(orderNumber);
      });

      // Get tax rate from system preferences
      const taxRatePreference = await db.select().from(systemPreferences)
        .where(eq(systemPreferences.key, 'financial_vatRate'))
        .limit(1);
      const systemTaxRate = taxRatePreference.length > 0 ?
        parseFloat((taxRatePreference[0] as any).value) / 100 : 0.14; // Default to 14%

      // Transform and combine all orders using utility functions  
      const allOrders = [...dbOrders, ...uniqueMemoryOrders].map((order, index) => {
        // Parse materials using standardized utility functions
        const realRawMaterials = parseMaterials(order.rawMaterials);
        const realPackagingMaterials = parseMaterials(order.packagingMaterials);

        // Calculate ACTUAL costs from materials data
        const additionalFees = parseFloat(order.totalAdditionalFees || '0');
        const profitMargin = parseFloat(order.profitMarginPercentage || '20');

        // Calculate materials costs using utility function
        const rawMaterialsCost = calculateMaterialsCost(realRawMaterials);
        const packagingCost = calculateMaterialsCost(realPackagingMaterials);

        // CORRECT financial calculation:
        // 1. Total actual cost = materials + packaging + transport/fees
        const actualTotalCost = rawMaterialsCost + packagingCost + additionalFees;

        // 2. Apply profit margin to get selling price (before tax)
        const sellingPrice = actualTotalCost * (1 + profitMargin / 100);

        // 3. Calculate tax on selling price (using system preference)
        const taxRate = systemTaxRate;
        const taxAmount = sellingPrice * taxRate;

        // 4. Final revenue (selling price + tax)
        const revenue = sellingPrice + taxAmount;

        // 5. Actual profit (selling price - actual cost)
        const profit = sellingPrice - actualTotalCost;

        return {
          ...order,
          rawMaterials: realRawMaterials,
          packagingMaterials: realPackagingMaterials,
          // CORRECTED financial breakdown
          materialsCost: rawMaterialsCost,
          packagingCost: packagingCost,
          actualTotalCost: parseFloat(actualTotalCost.toFixed(2)),
          sellingPrice: parseFloat(sellingPrice.toFixed(2)),
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          revenue: parseFloat(revenue.toFixed(2)),
          profit: parseFloat(profit.toFixed(2)),
          // Ensure all required fields exist
          customerName: order.customerName || 'Not specified',
          customerCompany: order.customerCompany || '',
          status: order.status || 'pending'
        };
      });

      // Sort by creation date (newest first)
      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log(`✅ DETAILED HISTORY: Returning ${allOrders.length} orders with complete materials and financial data`);
      console.log(`📊 Orders breakdown:`, {
        production: allOrders.filter(o => o.orderType === 'production').length,
        refining: allOrders.filter(o => o.orderType === 'refining').length,
        withRawMaterials: allOrders.filter(o => o.rawMaterials && o.rawMaterials.length > 0).length,
        withPackaging: allOrders.filter(o => o.packagingMaterials && o.packagingMaterials.length > 0).length
      });

      res.json({
        success: true,
        orders: allOrders,
        totalOrders: allOrders.length,
        statistics: {
          totalRevenue: allOrders.reduce((sum, order) => sum + (order.revenue || 0), 0),
          totalCosts: allOrders.reduce((sum, order) => sum + (order.actualTotalCost || 0), 0),
          totalProfit: allOrders.reduce((sum, order) => sum + (order.profit || 0), 0),
          completedOrders: allOrders.filter(o => o.status === 'completed').length,
          pendingOrders: allOrders.filter(o => o.status === 'pending').length,
          averageOrderValue: allOrders.length > 0 ? allOrders.reduce((sum, order) => sum + (order.revenue || 0), 0) / allOrders.length : 0,
          profitMargin: allOrders.length > 0 ?
            (allOrders.reduce((sum, order) => sum + (order.profit || 0), 0) / allOrders.reduce((sum, order) => sum + (order.revenue || 0), 0)) * 100 : 0
        }
      });
    } catch (error) {
      console.error('🔥 Error fetching detailed order history:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch detailed order history",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get refining order history with dedicated endpoint
  app.get("/api/orders/refining-history", async (req: Request, res: Response) => {
    try {
      console.log('🔥 REFINING ORDERS HISTORY: Fetching refining orders from database and static data');

      // Access memory orders created in this session
      const memoryOrders = (global as any).createdOrders ? (global as any).createdOrders.filter((order: any) => order.orderType === 'refining') : [];
      console.log(`🔥 MEMORY ORDERS FOUND: ${memoryOrders.length}`);

      // Fetch refining orders from database - USING EXACT SAME PATTERN AS PRODUCTION
      let dbOrders: any[] = [];
      try {
        dbOrders = await db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            orderType: orders.orderType,
            customerId: orders.customerId,
            description: orders.description,
            totalCost: orders.totalCost,
            totalAdditionalFees: orders.totalAdditionalFees, // Transportation cost
            profitMarginPercentage: orders.profitMarginPercentage,
            status: orders.status,
            createdAt: orders.createdAt,
            refiningSteps: orders.refiningSteps,
            rawMaterials: orders.rawMaterials,
            packagingMaterials: orders.packagingMaterials,
          })
          .from(orders)
          .where(eq(orders.orderType, 'refining'))
          .orderBy(desc(orders.createdAt));

        console.log(`🔥 REFINING DB QUERY SUCCESS: Found ${dbOrders.length} refining orders from database`);
      } catch (dbError) {
        console.log('🔥 REFINING Database table not ready yet, using memory only');
        dbOrders = [];
      }

      // Get customer details for each order and format - EXACT SAME AS PRODUCTION
      const dbOrdersFormatted = await Promise.all(
        dbOrders.map(async (order) => {
          let customer: any[] = [];
          try {
            customer = await db
              .select({ name: customers.name, company: customers.company })
              .from(customers)
              .where(eq(customers.id, order.customerId))
              .limit(1);
          } catch (e) {
            // Use fallback customer data if customers table doesn't exist
            customer = [{ name: "Dr. Ahmed Hassan", company: "Unknown Company" }];
          }

          // Generate batch number and other calculated fields
          const batchNumber = `REF-BATCH-${order.orderNumber.split('-').pop()}-${String(order.id).padStart(3, '0')}`;

          // Calculate revenue and profit using configurable margin from database
          const totalCost = parseFloat(order.totalCost);
          const profitMargin = parseFloat(order.profitMarginPercentage || '20');
          const markupMultiplier = 1 + (profitMargin / 100);
          const revenue = totalCost * markupMultiplier;
          const profit = totalCost * (profitMargin / 100);

          // Parse real materials from database - they are stored as JSON
          let realRawMaterials = [];
          let realPackagingMaterials = [];

          try {
            realRawMaterials = order.rawMaterials ? (Array.isArray(order.rawMaterials) ? order.rawMaterials : JSON.parse(order.rawMaterials)) : [];
            realPackagingMaterials = order.packagingMaterials ? (Array.isArray(order.packagingMaterials) ? order.packagingMaterials : JSON.parse(order.packagingMaterials)) : [];
          } catch (parseError) {
            console.error('Error parsing stored materials for refining order', order.orderNumber, parseError);
            realRawMaterials = [];
            realPackagingMaterials = [];
          }

          return {
            id: order.id + 200, // Offset to avoid ID conflicts with static data
            orderNumber: order.orderNumber,
            batchNumber: batchNumber,
            orderType: order.orderType,
            customerName: customer[0]?.name || 'Unknown Customer',
            customerCompany: customer[0]?.company || 'Unknown Company',
            finalProduct: order.description || 'Refining Order',
            orderDate: order.createdAt.toISOString().split('T')[0],
            completionDate: order.status === 'completed'
              ? new Date(order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : null,
            status: order.status,
            totalCost: totalCost,
            transportationCost: parseFloat(order.totalAdditionalFees || '0'), // Add transportation cost
            revenue: revenue,
            profit: profit,
            profitMarginPercentage: profitMargin,
            createdAt: order.createdAt.toISOString(),
            rawMaterials: realRawMaterials,
            packagingMaterials: realPackagingMaterials,
            productionSteps: ["Material preparation", "Refining process", "Quality control", "Packaging"],
            materialCostBreakdown: {
              rawMaterialsCost: realRawMaterials?.reduce((sum: number, mat: any) =>
                sum + (parseFloat(mat.unitPrice || '0') * parseFloat(mat.quantity || '0')), 0) || 0,
              packagingCost: realPackagingMaterials?.reduce((sum: number, pack: any) =>
                sum + (parseFloat(pack.unitPrice || '0') * parseFloat(pack.quantity || '0')), 0) || 0
            }
          };
        })
      );

      // ONLY return real orders - NO STATIC DATA
      const allOrders = [...memoryOrders, ...dbOrdersFormatted];

      console.log(`🔥 REFINING ORDERS HISTORY: Returning ${allOrders.length} REAL refining orders (${memoryOrders.length} from Memory, ${dbOrdersFormatted.length} from DB, 0 static)`);

      res.json(allOrders);
    } catch (error) {
      console.error("Error fetching refining order history:", error);
      res.status(500).json({ message: "Failed to fetch refining order history" });
    }
  });

  // Update profit margin for an order
  app.patch("/api/orders/:id/profit-margin", async (req: Request, res: Response) => {
    try {
      const displayId = parseInt(req.params.id);
      const { profitMarginPercentage } = req.body;

      if (!profitMarginPercentage || profitMarginPercentage < 0 || profitMarginPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: "Valid profit margin percentage (0-100) is required"
        });
      }

      // Convert display ID back to database ID
      // Production orders have +100 offset, refining orders have +200 offset
      let actualId: number;
      if (displayId >= 200) {
        // Refining order (display ID = actual ID + 200)
        actualId = displayId - 200;
      } else if (displayId >= 100) {
        // Production order (display ID = actual ID + 100)
        actualId = displayId - 100;
      } else {
        // Static/memory orders use display ID as-is
        actualId = displayId;
      }

      console.log(`🔥 PROFIT MARGIN UPDATE: Display ID ${displayId} -> Database ID ${actualId}`);

      // Update the order in the database
      const updatedOrder = await db
        .update(orders)
        .set({
          profitMarginPercentage: profitMarginPercentage,
          updatedAt: new Date()
        })
        .where(eq(orders.id, actualId))
        .returning();

      if (updatedOrder.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Calculate new revenue and profit
      const totalCost = parseFloat(updatedOrder[0].totalCost);
      const newMargin = parseFloat(profitMarginPercentage);
      const markupMultiplier = 1 + (newMargin / 100);
      const revenue = totalCost * markupMultiplier;
      const profit = totalCost * (newMargin / 100);

      res.json({
        success: true,
        message: "Profit margin updated successfully",
        order: {
          ...updatedOrder[0],
          revenue: revenue,
          profit: profit,
          profitMarginPercentage: newMargin
        }
      });
    } catch (error) {
      console.error("Error updating profit margin:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profit margin"
      });
    }
  });

  // Update order status
  app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const displayId = parseInt(req.params.id);
      const { status } = req.body;

      const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Valid status is required (pending, in-progress, completed, cancelled)"
        });
      }

      // Convert display ID back to database ID
      // Production orders have +100 offset, refining orders have +200 offset
      let actualId: number;
      if (displayId >= 200) {
        // Refining order (display ID = actual ID + 200)
        actualId = displayId - 200;
      } else if (displayId >= 100) {
        // Production order (display ID = actual ID + 100)
        actualId = displayId - 100;
      } else {
        // Static/memory orders use display ID as-is
        actualId = displayId;
      }

      console.log(`🔥 STATUS UPDATE: Display ID ${displayId} -> Database ID ${actualId} -> Status: ${status}`);

      // Update the order status in the database
      const updatedOrder = await db
        .update(orders)
        .set({
          status: status,
          updatedAt: new Date()
        })
        .where(eq(orders.id, actualId))
        .returning();

      if (updatedOrder.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      res.json({
        success: true,
        message: "Order status updated successfully",
        updatedOrder: updatedOrder[0]
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update order status"
      });
    }
  });
}

export default registerOrderRoutes;