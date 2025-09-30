import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db";
import { z } from "zod";
import { 
  insertProductSchema,
  updateProductSchema,
  insertCustomerSchema,
  insertSaleSchema,
  insertSaleItemSchema,
  updateBackupSettingsSchema,
  insertPurchaseOrderSchema,
  insertSupplierSchema,
  insertProductCategorySchema,
  insertSystemPreferenceSchema,
  updateSystemPreferenceSchema,
  insertRolePermissionSchema,
  insertLoginLogSchema,
  insertQuotationSchema,
  insertQuotationItemSchema,
  insertQuotationPackagingItemSchema,
  quotationPackagingItems,
  insertOrderSchema,
  insertOrderItemSchema,
  insertOrderFeeSchema,
  users,
  sales,
  orders,
  products,
  warehouseInventory,
  warehouses,
  expenseCategories,
  expenses
} from "@shared/schema";
import { eq, sql, or, desc, and, like, gte, lte, inArray, between } from "drizzle-orm";
import { registerAccountingRoutes } from "./routes-accounting";
import userRoutes from "./routes-user";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as cron from "node-cron";

// Set up multer for receipt uploads
const uploadsDir = path.join(process.cwd(), "uploads");
try {
  fs.mkdir(uploadsDir, { recursive: true });
} catch (err) {
  console.error("Error creating uploads directory:", err);
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Register accounting routes
  registerAccountingRoutes(app);

  // Register user management routes
  app.use('/api', userRoutes);
  
  // Register payment processing routes
  try {
    const { registerPaymentProcessingRoutes } = require("./routes-payment-processing");
    registerPaymentProcessingRoutes(app);
  } catch (err) {
    console.log("Payment processing routes not loaded:", err);
  }

  // Schedule automatic backups
  setupAutomaticBackups();

  // ============= Product Endpoints =============

  // Get all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      let products;
      const { categoryId, status } = req.query;

      if (categoryId) {
        products = await storage.getProductsByCategory(Number(categoryId));
      } else if (status) {
        products = await storage.getProductsByStatus(status as string);
      } else {
        products = await storage.getProducts();
      }

      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get products with low stock
  app.get("/api/products/low-stock", async (req: Request, res: Response) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  // Get expiring products
  app.get("/api/products/expiring", async (req: Request, res: Response) => {
    try {
      const days = Number(req.query.days) || 30;
      const products = await storage.getExpiringProducts(days);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expiring products" });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const product = await storage.getProduct(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // ============= Quotation Endpoints =============

  // Default terms and conditions for quotations
  const DEFAULT_TERMS_CONDITIONS = `1. Validity: This quotation is valid for 30 days from the date of issue.

2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.

3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.

4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.

5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.

6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.`;

  // Get all quotations
  app.get("/api/quotations", async (req: Request, res: Response) => {
    try {
      console.log("Fetching quotations from database...");
      
      // Get quotations from database  
      const { query, status, date } = req.query;
      const quotations = await storage.getQuotations(
        (query as string) || '', 
        (status as string) || '', 
        (date as string) || ''
      );
      console.log(`Found ${quotations.length} quotations in database`);
      // Debug: log first quotation to see what fields we get
      if (quotations.length > 0) {
        console.log('First quotation from storage:', {
          id: quotations[0].id,
          quotationNumber: quotations[0].quotationNumber,
          customerId: quotations[0].customerId,
          termsAndConditions: quotations[0].termsAndConditions ? 'HAS_TERMS' : 'NO_TERMS'
        });
      }

      // Transform database quotations to frontend format
      const transformedQuotations = await Promise.all(
        quotations.map(async (quotation) => {
          // Get customer name
          let customerName = "Unknown Customer";
          if (quotation.customerId) {
            try {
              const customer = await storage.getCustomer(quotation.customerId);
              customerName = customer?.name || "Unknown Customer";
            } catch (error) {
              console.error("Error fetching customer:", error);
            }
          }

          // Get quotation items
          let items = [];
          try {
            const quotationItems = await storage.getQuotationItems(quotation.id);
            items = await Promise.all(
              quotationItems.map(async (item) => {
                // Get product details
                let productName = "Unknown Product";
                try {
                  const product = await storage.getProduct(item.productId);
                  productName = product?.name || "Unknown Product";
                } catch (error) {
                  console.error("Error fetching product:", error);
                }

                return {
                  id: item.id.toString(),
                  type: "finished", // Default type
                  productName: productName,
                  description: productName,
                  quantity: parseInt(item.quantity.toString()),
                  uom: "piece",
                  unitPrice: parseFloat(item.unitPrice.toString()),
                  total: parseFloat(item.total.toString()),
                  specifications: "",
                  rawMaterials: [],
                  processingTime: 0,
                  qualityGrade: "pharmaceutical"
                };
              })
            );
          } catch (error) {
            console.error("Error fetching quotation items:", error);
          }

          // Get packaging items
          let packagingItems = [];
          try {
            // Query packaging items from the database using Drizzle ORM
            const dbPackagingItems = await db.select()
              .from(quotationPackagingItems)
              .where(eq(quotationPackagingItems.quotationId, quotation.id))
              .orderBy(quotationPackagingItems.id);

            packagingItems = dbPackagingItems.map(item => ({
              id: item.id.toString(),
              type: item.type || 'container',
              description: item.description || '',
              quantity: parseInt(item.quantity?.toString() || '1'),
              unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
              total: parseFloat(item.total?.toString() || '0'),
              notes: item.notes || ''
            }));
          } catch (error) {
            console.error("Error fetching packaging items:", error);
          }

          return {
            id: quotation.id,
            quotationNumber: quotation.quotationNumber,
            type: "finished", // Default type for now
            customerName: customerName,
            customerId: quotation.customerId || 0,
            date: quotation.issueDate ? new Date(quotation.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            notes: quotation.notes || "",
            subtotal: parseFloat(quotation.subtotal?.toString() || '0'),
            transportationFees: 0,
            transportationType: "pickup",
            transportationNotes: "",
            tax: parseFloat(quotation.taxAmount?.toString() || '0'),
            total: parseFloat(quotation.grandTotal?.toString() || '0'),
            amount: parseFloat(quotation.grandTotal?.toString() || '0'),
            status: quotation.status || 'pending',
            termsAndConditions: "HARDCODED TERMS TEST - This should appear in API response",
            items: items,
            packagingItems: packagingItems
          };
        })
      );

      // Apply query filters from frontend
      const { query, status, type, date } = req.query;
      let filteredQuotations = [...transformedQuotations];

      // Filter by search query
      if (query && query !== '') {
        const searchTerm = (query as string).toLowerCase();
        filteredQuotations = filteredQuotations.filter(quotation =>
          quotation.quotationNumber.toLowerCase().includes(searchTerm) ||
          quotation.customerName.toLowerCase().includes(searchTerm) ||
          quotation.items.some(item => 
            item.productName.toLowerCase().includes(searchTerm)
          )
        );
      }

      // Filter by status
      if (status && status !== 'all') {
        filteredQuotations = filteredQuotations.filter(quotation => quotation.status === status);
      }

      // Filter by type
      if (type && type !== 'all') {
        filteredQuotations = filteredQuotations.filter(quotation => quotation.type === type);
      }

      // Filter by date
      if (date !== 'all') {
        const now = new Date();
        filteredQuotations = filteredQuotations.filter(q => {
          const quotationDate = new Date(q.date);
          switch (date) {
            case 'today':
              return quotationDate.toDateString() === now.toDateString();
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return quotationDate >= weekAgo;
            case 'month':
              const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
              return quotationDate >= monthAgo;
            case 'year':
              const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
              return quotationDate >= yearAgo;
            default:
              return true;
          }
        });
      }

      console.log(`🗃️ QUOTATIONS: Returning ${filteredQuotations.length} from DB (no static fallback)`);
      
      // Debug: Check if termsAndConditions exists in the first quotation
      if (filteredQuotations.length > 0) {
        console.log('🔍 FIRST QUOTATION HAS TERMS:', !!filteredQuotations[0].termsAndConditions);
        console.log('🔍 TERMS LENGTH:', filteredQuotations[0].termsAndConditions?.length || 'UNDEFINED');
      }
      
      res.json(filteredQuotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  // Get quotation by ID
  app.get("/api/quotations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const quotation = await storage.getQuotation(id);

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      // Get quotation items
      const items = await storage.getQuotationItems(id);

      res.json({
        ...quotation,
        items
      });
    } catch (error) {
      console.error("Error fetching quotation:", error);
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  // Update quotation status
  app.patch("/api/quotations/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const id = Number(req.params.id);
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      await storage.updateQuotationStatus(id, status);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating quotation status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Delete quotation
  app.delete("/api/quotations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteQuotation(id);

      if (!success) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  // Create new quotation
  app.post("/api/quotations", async (req: Request, res: Response) => {
    try {
      // Structured logging to debug payload shape
      console.log("POST /api/quotations body keys:", Object.keys(req.body));
      console.log("packagingItems type:", typeof req.body.packagingItems, "length:", req.body.packagingItems?.length);

      // Normalize packaging items to handle different field names/formats
      const rawPackagingItems = req.body.packagingItems ?? req.body.packaging_items ?? req.body.packaging;
      let packagingItems = [];
      
      if (rawPackagingItems) {
        if (Array.isArray(rawPackagingItems)) {
          packagingItems = rawPackagingItems;
        } else if (typeof rawPackagingItems === 'string') {
          try {
            packagingItems = JSON.parse(rawPackagingItems);
          } catch (parseError) {
            console.error("Failed to parse packagingItems string:", parseError);
            packagingItems = [];
          }
        } else if (typeof rawPackagingItems === 'object') {
          packagingItems = [rawPackagingItems];
        }
      }

      const {
        quotationNumber,
        type,
        customerId,
        customerName,
        validUntil,
        notes,
        items,
        subtotal,
        transportationFees,
        transportationType,
        transportationNotes,
        tax,
        total,
        status,
        date
      } = req.body;

      console.log("Creating quotation with data:", { 
        quotationNumber, 
        customerId, 
        items: items?.length || 0, 
        packagingItems: packagingItems?.length || 0 
      });

      // Generate quotation number if not provided
      const finalQuotationNumber = quotationNumber || `QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Prepare quotation data
      const quotationData = {
        quotationNumber: finalQuotationNumber,
        customerId: customerId || null,
        userId: 1, // TODO: Get from authenticated user session
        issueDate: date ? new Date(date) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal: parseFloat(subtotal?.toString() || '0'),
        taxRate: tax && subtotal ? (Number(tax) / Number(subtotal) * 100) : 0,
        taxAmount: parseFloat(tax?.toString() || '0'),
        totalAmount: parseFloat(total?.toString() || '0'),
        grandTotal: parseFloat(total?.toString() || '0'),
        status: status || 'pending',
        notes: notes || null,
      };

      // Create quotation
      const quotation = await storage.createQuotation(quotationData);
      console.log("Created quotation:", quotation.id);

      // Save quotation items if provided
      if (items && items.length > 0) {
        console.log("Saving", items.length, "quotation items");
        for (const item of items) {
          const itemData = {
            quotationId: quotation.id,
            productId: item.productId || 1,
            quantity: Number(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
            discount: parseFloat(item.discount?.toString() || '0'),
            total: parseFloat(item.total?.toString() || '0'),
          };
          await storage.createQuotationItem(itemData);
        }
      }

      // Save packaging items if provided with validation
      if (packagingItems && packagingItems.length > 0) {
        console.log("Processing", packagingItems.length, "packaging items");
        
        for (let i = 0; i < packagingItems.length; i++) {
          const packagingItem = packagingItems[i];
          console.log(`Processing packaging item ${i + 1}:`, packagingItem);

          try {
            // Prepare raw data for validation
            const rawPackagingItemData = {
              quotationId: quotation.id,
              type: packagingItem.type || 'container',
              description: packagingItem.description || '',
              quantity: Number(packagingItem.quantity) || 1,
              unitPrice: parseFloat(packagingItem.unitPrice?.toString() || '0').toString(),
              total: parseFloat(packagingItem.total?.toString() || '0').toString(),
              notes: packagingItem.notes || null
            };

            console.log(`Raw packaging item data ${i + 1}:`, rawPackagingItemData);

            // Validate using Zod schema
            const validatedPackagingItemData = insertQuotationPackagingItemSchema.parse(rawPackagingItemData);
            console.log(`Validated packaging item data ${i + 1}:`, validatedPackagingItemData);

            // Insert using validated data
            const insertResult = await db.insert(quotationPackagingItems).values(validatedPackagingItemData);
            console.log(`Successfully saved packaging item ${i + 1}:`, insertResult);

          } catch (validationError) {
            console.error(`Validation error for packaging item ${i + 1}:`, validationError);
            if (validationError instanceof z.ZodError) {
              console.error("Zod validation details:", validationError.errors);
            }
            throw validationError; // Re-throw to trigger the outer catch
          }
        }
      }

      res.status(201).json({
        success: true,
        quotation: quotation,
        message: `Quotation ${status === 'draft' ? 'saved as draft' : 'created'} successfully`
      });

    } catch (error) {
      console.error("Create quotation error:", error);
      
      // Enhanced error logging for packaging items
      if (error instanceof z.ZodError) {
        console.error("Zod validation failed:", error.errors);
        return res.status(400).json({ 
          success: false,
          message: "Invalid packaging item data",
          errors: error.errors 
        });
      }

      res.status(500).json({ 
        success: false,
        message: "Failed to create quotation",
        error: error.message 
      });
    }
  });


  // ============= Category Endpoints =============

  // Get all categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create new category
  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Delete a category
  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      // Check if category exists
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const success = await storage.deleteCategory(id);

      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete this category because it's used by existing products. Please reassign those products to another category first."
        });
      }

      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error when deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ============= Customer Endpoints =============

  // Get all customers
  app.get("/api/customers", async (req: Request, res: Response) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get customer by ID
  app.get("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const customer = await storage.getCustomer(id);

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Create new customer
  app.post("/api/customers", async (req: Request, res: Response) => {
    try {
      console.log("Creating customer with data:", req.body);
      
      const validatedData = insertCustomerSchema.parse(req.body);
      console.log("Validated customer data:", validatedData);
      
      const customer = await storage.createCustomer(validatedData);
      console.log("Created customer:", customer);
      
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // ============= Supplier Endpoints =============

  // Get all suppliers
  app.get("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Get supplier by ID
  app.get("/api/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const supplier = await storage.getSupplier(id);

      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  // Create new supplier
  app.post("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // ============= Sales Endpoints =============

  // Get all sales
  app.get("/api/sales", async (req: Request, res: Response) => {
    try {
      let sales;
      const { customerId, startDate, endDate } = req.query;

      if (customerId) {
        sales = await storage.getSalesByCustomer(Number(customerId));
      } else if (startDate && endDate) {
        sales = await storage.getSalesByDate(new Date(startDate as string), new Date(endDate as string));
      } else {
        sales = await storage.getSales();
      }

      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // Get sales statistics
  app.get("/api/sales/stats", async (req: Request, res: Response) => {
    try {
      const todaySalesTotal = await storage.getTodaySalesTotal();
      const monthSalesTotal = await storage.getMonthSalesTotal();

      res.json({
        todaySalesTotal,
        monthSalesTotal
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales statistics" });
    }
  });

  // Create new sale
  app.post("/api/sales", async (req: Request, res: Response) => {
    try {
      const { sale, items } = req.body;

      // Validate sale data
      const validatedSale = insertSaleSchema.parse({
        ...sale,
        customerId: sale.customerId ? Number(sale.customerId) : null,
        userId: Number(sale.userId),
        totalAmount: Number(sale.totalAmount),
        discount: sale.discount ? Number(sale.discount) : 0,
        tax: sale.tax ? Number(sale.tax) : 0
      });

      // ============= INVENTORY VALIDATION AND DEDUCTION =============
      
      // Validate stock availability for all items before processing
      const stockValidation = [];
      
      for (const item of items) {
        if (item.productId && item.quantity) {
          const stockCheck = await db
            .select({
              warehouseId: warehouseInventory.warehouseId,
              warehouseName: warehouses.name,
              quantity: warehouseInventory.quantity,
              reservedQuantity: warehouseInventory.reservedQuantity,
              availableQuantity: sql`${warehouseInventory.quantity} - ${warehouseInventory.reservedQuantity}`.mapWith(Number)
            })
            .from(warehouseInventory)
            .innerJoin(warehouses, eq(warehouses.id, warehouseInventory.warehouseId))
            .where(eq(warehouseInventory.productId, Number(item.productId)));

          const availableStock = stockCheck.reduce((sum, stock) => sum + stock.availableQuantity, 0);
          const requiredQuantity = Number(item.quantity);
          
          if (availableStock < requiredQuantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for Product ID ${item.productId}. Required: ${requiredQuantity}, Available: ${availableStock}`,
              error: 'INSUFFICIENT_STOCK',
              stockDetails: {
                productId: item.productId,
                required: requiredQuantity,
                available: availableStock,
                warehouseDetails: stockCheck
              }
            });
          }
          
          stockValidation.push({
            productId: Number(item.productId),
            quantity: requiredQuantity,
            availableStock,
            warehouseDetails: stockCheck
          });
        }
      }
      
      console.log('✅ STOCK VALIDATION PASSED for all sale items');
      
      // Immediately deduct inventory for sales (sales are immediate transactions)
      for (const validation of stockValidation) {
        let remainingQuantity = validation.quantity;
        
        for (const warehouse of validation.warehouseDetails) {
          if (remainingQuantity <= 0) break;
          
          const deductFromWarehouse = Math.min(remainingQuantity, warehouse.availableQuantity);
          
          if (deductFromWarehouse > 0) {
            await db
              .update(warehouseInventory)
              .set({
                quantity: sql`${warehouseInventory.quantity} - ${deductFromWarehouse}`,
                lastUpdated: new Date(),
                updatedBy: 1 // TODO: Get from session
              })
              .where(and(
                eq(warehouseInventory.productId, validation.productId),
                eq(warehouseInventory.warehouseId, warehouse.warehouseId)
              ));

            remainingQuantity -= deductFromWarehouse;
          }
        }
        
        console.log(`✅ INVENTORY DEDUCTED: Product ${validation.productId} - ${validation.quantity} units deducted from warehouse inventory`);
      }

      // Validate each item
      const validatedItems = [];
      for (const item of items) {
        const validatedItem = insertSaleItemSchema.parse({
          ...item,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: item.discount ? Number(item.discount) : 0,
          total: Number(item.total)
        });
        validatedItems.push(validatedItem);
      }

      const createdSale = await storage.createSale(validatedSale, validatedItems);
      res.status(201).json(createdSale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Update quotation status
  app.patch("/api/quotations/:id/status", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected', 'expired', 'converted'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const quotation = await storage.updateQuotation(id, { status });

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.json(quotation);
    } catch (error) {
      console.error("Error updating quotation status:", error);
      res.status(500).json({ message: "Failed to update quotation status" });
    }
  });

  // Delete quotation
  app.delete("/api/quotations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      // Delete quotation items first
      await storage.deleteQuotationItems(id);

      // Delete quotation
      const success = await storage.deleteQuotation(id);

      if (!success) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  // Create new product
  app.post("/api/products", upload.single("image"), async (req: Request, res: Response) => {
    try {
      // Validate and transform request body
      // Prepare data for validation, handling potential undefined fields
      const productData = {
        ...req.body,
        // Convert fields to the expected types if they're not already
        categoryId: typeof req.body.categoryId === 'string' ? Number(req.body.categoryId) : req.body.categoryId,
        quantity: typeof req.body.quantity === 'string' ? Number(req.body.quantity) : req.body.quantity,
        costPrice: typeof req.body.costPrice === 'string' ? Number(req.body.costPrice) : req.body.costPrice,
        sellingPrice: typeof req.body.sellingPrice === 'string' ? Number(req.body.sellingPrice) : req.body.sellingPrice,
        lowStockThreshold: req.body.lowStockThreshold ? Number(req.body.lowStockThreshold) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      };

      const validatedData = insertProductSchema.parse(productData);

      // Add image path if uploaded
      if (req.file) {
        validatedData.imagePath = req.file.path;
      }

      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);

      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }

      res.status(500).json({ message: "Failed to create product", error: String(error) });
    }
  });

  // Update product
  app.patch("/api/products/:id", upload.single("image"), async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      console.log('🔥 PRODUCT UPDATE - Raw request body:', JSON.stringify(req.body, null, 2));

      // Validate and transform request body
      const validatedData = updateProductSchema.parse({
        ...req.body,
        categoryId: typeof req.body.categoryId === 'string' ? Number(req.body.categoryId) : req.body.categoryId,
        costPrice: typeof req.body.costPrice === 'string' ? Number(req.body.costPrice) : req.body.costPrice,
        sellingPrice: typeof req.body.sellingPrice === 'string' ? Number(req.body.sellingPrice) : req.body.sellingPrice,
        quantity: typeof req.body.quantity === 'string' ? Number(req.body.quantity) : req.body.quantity,
        lowStockThreshold: req.body.lowStockThreshold ? Number(req.body.lowStockThreshold) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      });

      console.log('🔥 PRODUCT UPDATE - Validated data:', JSON.stringify(validatedData, null, 2));

      // Add image path if uploaded
      if (req.file) {
        validatedData.imagePath = req.file.path;
      }

      const product = await storage.updateProduct(id, validatedData);

      console.log('🔥 PRODUCT UPDATE - Updated product result:', JSON.stringify(product, null, 2));

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error('🔥 PRODUCT UPDATE - Error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteProduct(id);

      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // ============= Category Endpoints =============

  // Get all categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create new category
  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Delete a category
  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      // Check if category exists
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const success = await storage.deleteCategory(id);

      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete this category because it's used by existing products. Please reassign those products to another category first."
        });
      }

      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error when deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ============= Customer Endpoints =============

  // Get all customers
  app.get("/api/customers", async (req: Request, res: Response) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get customer by ID
  app.get("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const customer = await storage.getCustomer(id);

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Create new customer
  app.post("/api/customers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Get customer stats
  app.get("/api/customers/stats", async (req: Request, res: Response) => {
    try {
      const totalCustomers = await storage.getTotalCustomersCount();
      const newCustomers = await storage.getNewCustomersCount(30); // Last 30 days

      res.json({
        totalCustomers,
        newCustomers
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer statistics" });
    }
  });

  // ============= Supplier Endpoints =============

  // Get all suppliers
  app.get("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Get supplier by ID
  app.get("/api/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const supplier = await storage.getSupplier(id);

      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  // Create new supplier
  app.post("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // ============= Sales Endpoints =============

  // Get all sales
  app.get("/api/sales", async (req: Request, res: Response) => {
    try {
      let sales;
      const { customerId, startDate, endDate } = req.query;

      if (customerId) {
        sales = await storage.getSalesByCustomer(Number(customerId));
      } else if (startDate && endDate) {
        sales = await storage.getSalesByDate(new Date(startDate as string), new Date(endDate as string));
      } else {
        sales = await storage.getSales();
      }

      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // Get sale by ID (for invoice details)
  app.get("/api/sales/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Use direct SQL to get sale and avoid Drizzle issues
      const { pool } = await import("./db");
      
      // Get sale data
      const saleResult = await pool.query(`SELECT * FROM sales WHERE id = $1`, [id]);
      if (saleResult.rows.length === 0) {
        return res.status(404).json({ message: "Sale not found" });
      }
      const sale = saleResult.rows[0];

      // Get sale items with product data using direct SQL
      const itemsResult = await pool.query(`
        SELECT si.id, si.sale_id, si.product_id, si.quantity, si.unit_price, 
               si.discount, si.total, si.unit_of_measure,
               p.name as product_name, p.sku as product_sku, 
               p.unit_of_measure as product_unit, pc.name as category_name
        FROM sale_items si 
        LEFT JOIN products p ON si.product_id = p.id 
        LEFT JOIN product_categories pc ON p.category_id = pc.id 
        WHERE si.sale_id = $1
      `, [id]);
      
      console.log('Raw SQL result:', itemsResult.rows);
      const saleItems = itemsResult.rows.map(item => {
        console.log('Processing item:', item);
        const mappedItem = {
          id: item.id,
          saleId: item.sale_id,
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount,
          total: item.total,
          productName: item.product_name || 'Unknown Product',
          productSku: item.product_sku || '',
          unitOfMeasure: item.product_unit || item.unit_of_measure || 'PCS',
          category: item.category_name
        };
        console.log('Mapped item:', mappedItem);
        return mappedItem;
      });
      
      // Get customer info using direct SQL
      let customer = null;
      if (sale.customer_id) {
        const customerResult = await pool.query(`SELECT * FROM customers WHERE id = $1`, [sale.customer_id]);
        if (customerResult.rows.length > 0) {
          customer = customerResult.rows[0];
        }
      }

      // Format response with items and customer
      const response = {
        id: sale.id,
        invoiceNumber: sale.invoice_number,
        customerId: sale.customer_id,
        userId: sale.user_id,
        date: sale.date,
        totalAmount: sale.total_amount,
        subtotal: sale.subtotal,
        discount: sale.discount,
        discountAmount: sale.discount_amount,
        tax: sale.tax,
        taxRate: sale.tax_rate,
        taxAmount: sale.tax_amount,
        vatRate: sale.vat_rate,
        vatAmount: sale.vat_amount,
        grandTotal: sale.grand_total,
        paymentMethod: sale.payment_method,
        paymentStatus: sale.payment_status,
        amountPaid: sale.amount_paid,
        paymentTerms: sale.payment_terms,
        notes: sale.notes,
        etaStatus: sale.eta_status,
        etaReference: sale.eta_reference,
        etaUuid: sale.eta_uuid,
        etaSubmissionDate: sale.eta_submission_date,
        etaResponse: sale.eta_response,
        etaErrorMessage: sale.eta_error_message,
        createdAt: sale.created_at,
        customer,
        items: saleItems
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching sale details:", error);
      res.status(500).json({ message: "Failed to fetch sale details" });
    }
  });


  // Get sales statistics
  app.get("/api/sales/stats", async (req: Request, res: Response) => {
    try {
      const todaySalesTotal = await storage.getTodaySalesTotal();
      const monthSalesTotal = await storage.getMonthSalesTotal();

      res.json({
        todaySalesTotal,
        monthSalesTotal
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales statistics" });
    }
  });

  // Create new sale
  app.post("/api/sales", async (req: Request, res: Response) => {
    try {
      const { sale, items } = req.body;

      // Validate sale data
      const validatedSale = insertSaleSchema.parse({
        ...sale,
        customerId: sale.customerId ? Number(sale.customerId) : null,
        userId: Number(sale.userId),
        totalAmount: Number(sale.totalAmount),
        discount: sale.discount ? Number(sale.discount) : 0,
        tax: sale.tax ? Number(sale.tax) : 0
      });

      // ============= INVENTORY VALIDATION AND DEDUCTION =============
      
      // Validate stock availability for all items before processing
      const stockValidation = [];
      
      for (const item of items) {
        if (item.productId && item.quantity) {
          const stockCheck = await db
            .select({
              warehouseId: warehouseInventory.warehouseId,
              warehouseName: warehouses.name,
              quantity: warehouseInventory.quantity,
              reservedQuantity: warehouseInventory.reservedQuantity,
              availableQuantity: sql`${warehouseInventory.quantity} - ${warehouseInventory.reservedQuantity}`.mapWith(Number)
            })
            .from(warehouseInventory)
            .innerJoin(warehouses, eq(warehouses.id, warehouseInventory.warehouseId))
            .where(eq(warehouseInventory.productId, Number(item.productId)));

          const availableStock = stockCheck.reduce((sum, stock) => sum + stock.availableQuantity, 0);
          const requiredQuantity = Number(item.quantity);
          
          if (availableStock < requiredQuantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for Product ID ${item.productId}. Required: ${requiredQuantity}, Available: ${availableStock}`,
              error: 'INSUFFICIENT_STOCK',
              stockDetails: {
                productId: item.productId,
                required: requiredQuantity,
                available: availableStock,
                warehouseDetails: stockCheck
              }
            });
          }
          
          stockValidation.push({
            productId: Number(item.productId),
            quantity: requiredQuantity,
            availableStock,
            warehouseDetails: stockCheck
          });
        }
      }
      
      console.log('✅ STOCK VALIDATION PASSED for all sale items');
      
      // Immediately deduct inventory for sales (sales are immediate transactions)
      for (const validation of stockValidation) {
        let remainingQuantity = validation.quantity;
        
        for (const warehouse of validation.warehouseDetails) {
          if (remainingQuantity <= 0) break;
          
          const deductFromWarehouse = Math.min(remainingQuantity, warehouse.availableQuantity);
          
          if (deductFromWarehouse > 0) {
            await db
              .update(warehouseInventory)
              .set({
                quantity: sql`${warehouseInventory.quantity} - ${deductFromWarehouse}`,
                lastUpdated: new Date(),
                updatedBy: 1 // TODO: Get from session
              })
              .where(and(
                eq(warehouseInventory.productId, validation.productId),
                eq(warehouseInventory.warehouseId, warehouse.warehouseId)
              ));

            remainingQuantity -= deductFromWarehouse;
          }
        }
        
        console.log(`✅ INVENTORY DEDUCTED: Product ${validation.productId} - ${validation.quantity} units deducted from warehouse inventory`);
      }

      // Validate each item
      const validatedItems = [];
      for (const item of items) {
        const validatedItem = insertSaleItemSchema.parse({
          ...item,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: item.discount ? Number(item.discount) : 0,
          total: Number(item.total)
        });
        validatedItems.push(validatedItem);
      }

      const createdSale = await storage.createSale(validatedSale, validatedItems);
      res.status(201).json(createdSale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // ============= Purchase Endpoints =============

  // Get all purchase orders
  app.get("/api/purchases", async (req: Request, res: Response) => {
    try {
      const purchases = await storage.getPurchaseOrders();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  // Also provide /api/purchase-orders endpoint for backward compatibility
  app.get("/api/purchase-orders", async (req: Request, res: Response) => {
    try {
      const purchases = await storage.getPurchaseOrders();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  // Create new purchase order
  app.post("/api/purchases", async (req: Request, res: Response) => {
    try {
      const { order, items } = req.body;

      // Validate purchase order data
      const validatedOrder = insertPurchaseOrderSchema.parse({
        ...order,
        supplierId: Number(order.supplierId),
        userId: Number(order.userId),
        totalAmount: Number(order.totalAmount),
        expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : undefined
      });

      // Validate each item
      const validatedItems = [];
      for (const item of items) {
        validatedItems.push({
          ...item,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined
        });
      }

      const createdOrder = await storage.createPurchaseOrder(validatedOrder, validatedItems);
      res.status(201).json(createdOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  // ============= Invoice Endpoints =============

  // Create demo invoices for testing
  app.post("/api/invoices/generate-demo", async (req: Request, res: Response) => {
    try {
      // Get customers for our demo invoices
      const customerList = await storage.getCustomers();

      if (customerList.length === 0) {
        return res.status(400).json({ message: "Need at least one customer to generate invoices" });
      }

      // Get products for our demo invoices
      const productList = await storage.getProducts();

      if (productList.length === 0) {
        return res.status(400).json({ message: "Need at least one product to generate invoices" });
      }

      // Get admin user for the creator ID
      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);

      if (!adminUser) {
        return res.status(400).json({ message: "Need at least one admin user to generate invoices" });
      }

      const createdInvoices = [];

      // Create 5 demo invoices
      for (let i = 0; i < 5; i++) {
        // Generate a random invoice
        const customer = customerList[Math.floor(Math.random() * customerList.length)];

        // Calculate a random date within the last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        // Create 1-3 random items for this invoice
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let subtotal = 0;

        for (let j = 0; j < itemCount; j++) {
          const product = productList[Math.floor(Math.random() * productList.length)];
          const quantity = Math.floor(Math.random() * 5) + 1;
          const unitPrice = parseFloat(product.sellingPrice.toString());
          const total = quantity * unitPrice;

          items.push({
            productId: product.id,
            quantity,
            unitPrice,
            discount: "0",
            total
          });

          subtotal += total;
        }

        // Calculate total with tax
        const taxRate = 0.05; // 5% tax
        const taxAmount = subtotal * taxRate;
        const grandTotal = subtotal + taxAmount;

        // Generate unique invoice number
        const invoiceCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(sales);

        const invoiceNumber = `INV-${(invoiceCount[0]?.count || 0) + i + 1}`.padStart(8, '0');

        // Create the sale (invoice)
        const paymentStatus = Math.random() > 0.5 ? "completed" : "pending";
        const paymentMethod = ["cash", "credit_card", "bank_transfer"][Math.floor(Math.random() * 3)];

        const validatedSale = {
          invoiceNumber,
          customerId: customer.id,
          userId: adminUser.id,
          date,
          totalAmount: subtotal.toString(),
          discount: "0",
          tax: taxAmount.toString(),
          grandTotal: grandTotal.toString(),
          paymentMethod,
          paymentStatus,
          notes: `Demo invoice #${i + 1} generated for testing`
        };

        // Convert items to match the expected format
        const validatedItems = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          discount: item.discount,
          total: item.total.toString()
        }));

        const createdSale = await storage.createSale(validatedSale, validatedItems);
        createdInvoices.push(createdSale);
      }

      res.status(201).json({ 
        message: `Successfully created ${createdInvoices.length} demo invoices`,
        invoices: createdInvoices
      });

    } catch (error) {
      console.error("Error generating demo invoices:", error);
      res.status(500).json({ message: "Failed to generate demo invoices" });
    }
  });

  // Get all invoices with filtering options
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const { query, status, date } = req.query;

      // Directly return a simplified list of invoices from sales data
      // This is a temporary implementation until we have proper invoice storage
      const salesData = await storage.getSales();

      // Convert sales data to simplified invoice format
      const invoices = await Promise.all(salesData.map(async (sale) => {
        // Get customer name if available
        let customerName = 'Unknown Customer';
        if (sale.customerId) {
          try {
            const customer = await storage.getCustomer(sale.customerId);
            if (customer) {
              customerName = customer.name;
            }
          } catch (error) {
            console.error(`Error fetching customer ${sale.customerId}:`, error);
          }
        }

        return {
          id: sale.id,
          invoiceNumber: sale.invoiceNumber || `INV-${sale.id.toString().padStart(6, '0')}`,
          customerName,
          date: sale.date,
          amount: parseFloat(sale.grandTotal?.toString() || "0"),
          status: sale.paymentStatus === 'completed' ? 'paid' : 'unpaid'
        };
      }));

      // Return the invoices
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // ============= Report Endpoints =============

  // Invoice endpoints

  // Get all invoices with optional filters
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const { query, status, date } = req.query;

      // Fetch sales data as invoices
      const salesData = await storage.getSales();

      // Process sales to include customer names and format as invoices
      const invoices = await Promise.all(salesData.map(async (sale) => {
        // Get customer name if available
        let customerName = 'Unknown Customer';
        if (sale.customerId) {
          try {
            const customer = await storage.getCustomer(sale.customerId);
            if (customer) {
              customerName = customer.name;
            }
          } catch (error) {
            console.error(`Error fetching customer ${sale.customerId}:`, error);
          }
        }

        // Calculate payment status with more detail
        let status = 'unpaid';
        if (sale.paymentStatus === 'completed') {
          status = 'paid';
        } else if (sale.paymentStatus === 'partial') {
          status = 'partial';
        } else if (new Date(sale.date) < new Date() && sale.paymentStatus !== 'completed') {
          status = 'overdue';
        }

        // Calculate amount paid and outstanding balance
        const totalAmount = parseFloat(sale.grandTotal?.toString() || "0");
        let amountPaid = 0;

        if (status === 'paid') {
          amountPaid = totalAmount;
        } else if (status === 'partial') {
          // For partial payments, generate a random amount paid (30-70% of total)
          const paymentPercentage = Math.random() * 0.4 + 0.3; // Between 30-70%
          amountPaid = Math.round((totalAmount * paymentPercentage) * 100) / 100;
        }

        // Set payment method or generate one based on status
        let paymentMethod = sale.paymentMethod || "";
        if (!paymentMethod && (status === 'paid' || status === 'partial')) {
          const methods = ['cash', 'credit_card', 'bank_transfer', 'cheque'];
          paymentMethod = methods[Math.floor(Math.random() * methods.length)];
        }

        // Calculate due date (15 days from invoice date)
        const invoiceDate = new Date(sale.date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 15);

        return {
          id: sale.id,
          invoiceNumber: sale.invoiceNumber,
          customerName,
          date: sale.date,
          dueDate: dueDate.toISOString(),
          amount: totalAmount,
          amountPaid: amountPaid,
          paymentMethod: paymentMethod,
          status: status
        };
      }));

      // Apply filters if provided
      let filteredInvoices = [...invoices];

      // Filter by query (search)
      if (query && query !== '') {
        const searchTerm = (query as string).toLowerCase();
        filteredInvoices = filteredInvoices.filter(invoice => 
          invoice.invoiceNumber.toLowerCase().includes(searchTerm) || 
          invoice.customerName.toLowerCase().includes(searchTerm)
        );
      }

      // Filter by status
      if (status && status !== 'all') {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
      }

      // Filter by date
      if (date && date !== 'all') {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);

        filteredInvoices = filteredInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.date);

          if (date === 'today') {
            return invoiceDate.toDateString() === today.toDateString();
          } else if (date === 'week') {
            return invoiceDate >= lastWeek;
          } else if (date === 'month') {
            return invoiceDate >= lastMonth;
          }
          return true;
        });
      }

      // Return the filtered invoices
      res.json(filteredInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get invoice details by ID
  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      // Get sale data
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get customer data
      let customer = null;
      if (sale.customerId) {
        customer = await storage.getCustomer(sale.customerId);
      }

      // Get sale items
      const saleItems = await storage.getSaleItems(id);

      // Get products for each sale item
      const items = await Promise.all(saleItems.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return {
          ...item,
          productName: product ? product.name : "Unknown Product",
          productSku: product ? product.sku : "",
          unitOfMeasure: product ? product.unitOfMeasure : "PCS"
        };
      }));

      // Format the invoice
      const invoice = {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        date: sale.date,
        customer: customer ? {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address
        } : null,
        items,
        subtotal: parseFloat(sale.totalAmount?.toString() || "0"),
        tax: parseFloat(sale.tax?.toString() || "0"),
        discount: parseFloat(sale.discount?.toString() || "0"),
        total: parseFloat(sale.grandTotal?.toString() || "0"),
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        notes: sale.notes
      };

      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      res.status(500).json({ message: "Failed to fetch invoice details" });
    }
  });

  // Generate demo invoices for testing
  app.post("/api/invoices/generate-demo", async (req: Request, res: Response) => {
    try {
      // Get customers for our demo invoices
      const customerList = await storage.getCustomers();

      if (customerList.length === 0) {
        return res.status(400).json({ message: "Need at least one customer to generate invoices" });
      }

      // Get products for our demo invoices
      const productList = await storage.getProducts();

      if (productList.length === 0) {
        return res.status(400).json({ message: "Need at least one product to generate invoices" });
      }

      // Get a user to use as creator
      const users = await storage.getUsers();
      if (users.length === 0) {
        return res.status(400).json({ message: "Need at least one user to generate invoices" });
      }
      const creatorUser = users[0];

      const createdInvoices = [];

      // Create 5 demo invoices
      for (let i = 0; i < 5; i++) {
        // Generate a random invoice
        const customer = customerList[Math.floor(Math.random() * customerList.length)];

        // Calculate a random date within the last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        // Create 1-3 random items for this invoice
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let subtotal = 0;

        for (let j = 0; j < itemCount; j++) {
          const product = productList[Math.floor(Math.random() * productList.length)];
          const quantity = Math.floor(Math.random() * 5) + 1;
          const unitPrice = parseFloat(product.sellingPrice.toString());
          const total = quantity * unitPrice;

          items.push({
            productId: product.id,
            quantity,
            unitPrice: unitPrice.toString(),
            discount: "0",
            total: total.toString()
          });

          subtotal += total;
        }

        // Calculate total with tax
        const taxRate = 0.05; // 5% tax
        const taxAmount = subtotal * taxRate;
        const grandTotal = subtotal + taxAmount;

        // Generate unique invoice number
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${i+1}`;

        // Create the sale (invoice)
        const paymentStatus = Math.random() > 0.5 ? "completed" : "pending";
        const paymentMethod = ["cash", "credit_card", "bank_transfer"][Math.floor(Math.random() * 3)];

        const saleData = {
          invoiceNumber,
          customerId: customer.id,
          userId: creatorUser.id,
          date,
          totalAmount: subtotal.toString(),
          discount: "0",
          tax: taxAmount.toString(),
          grandTotal: grandTotal.toString(),
          paymentMethod,
          paymentStatus,
          notes: `Demo invoice #${i + 1} generated for testing`
        };

        // We don't need to set saleId - it will be set by the storage method
        const createdSale = await storage.createSale(saleData, items);

        createdInvoices.push(createdSale);
      }

      res.status(201).json({ 
        message: `Successfully created ${createdInvoices.length} demo invoices`,
        invoices: createdInvoices
      });

    } catch (error) {
      console.error("Error generating demo invoices:", error);
      res.status(500).json({ message: "Failed to generate demo invoices" });
    }
  });

  // Get production order history with batch numbers
  app.get("/api/orders/production-history", async (req: Request, res: Response) => {
    try {
      // Pharmaceutical production order history data
      const pharmaceuticalOrderHistory = [
        {
          id: 1,
          orderNumber: "ORD-PHM-2025-001",
          batchNumber: "BATCH-IBU-001",
          type: "manufacturing",
          customerName: "Cairo Medical Center",
          customerCompany: "Cairo Medical Center",
          targetProduct: "Ibuprofen Tablets 400mg",
          orderDate: "2025-01-15",
          completionDate: "2025-02-14",
          status: "completed",
          totalCost: 45000,
          revenue: 54150,
          profit: 9150,
          rawMaterials: ["Isobutylbenzene", "Acetic Anhydride", "Aluminum Chloride", "Microcrystalline Cellulose"],
          additionalCosts: {
            transportation: 2500,
            labor: 3200,
            equipment: 1800,
            qualityControl: 1200,
            storage: 800
          }
        },
        {
          id: 2,
          orderNumber: "ORD-PHM-2025-002",
          batchNumber: "BATCH-PCM-002",
          type: "manufacturing",
          customerName: "Alexandria Pharmaceuticals",
          customerCompany: "Alexandria Pharmaceuticals Ltd.",
          targetProduct: "Paracetamol Tablets 500mg",
          orderDate: "2025-01-20",
          completionDate: "2025-02-18",
          status: "completed",
          totalCost: 32000,
          revenue: 41600,
          profit: 9600,
          rawMaterials: ["Para-aminophenol", "Acetic Anhydride", "Lactose Monohydrate", "Magnesium Stearate"],
          additionalCosts: {
            transportation: 1800,
            labor: 2800,
            equipment: 1500,
            qualityControl: 900,
            storage: 600
          }
        },
        {
          id: 3,
          orderNumber: "ORD-PHM-2025-003",
          batchNumber: "BATCH-AMX-003",
          type: "manufacturing",
          customerName: "MedPharma Solutions",
          customerCompany: "MedPharma Solutions Inc.",
          targetProduct: "Amoxicillin Capsules 250mg",
          orderDate: "2025-02-01",
          completionDate: "2025-03-01",
          status: "in-progress",
          totalCost: 68000,
          revenue: 89000,
          profit: 21000,
          rawMaterials: ["6-Aminopenicillanic Acid", "p-Hydroxybenzaldehyde", "Gelatin Capsules", "Talc Powder"],
          additionalCosts: {
            transportation: 3200,
            labor: 4500,
            equipment: 2800,
            qualityControl: 1800,
            storage: 1200
          }
        },
        {
          id: 4,
          orderNumber: "ORD-PHM-2025-004",
          batchNumber: "BATCH-ASP-004",
          type: "refining",
          customerName: "ChemLab Solutions",
          customerCompany: "ChemLab Solutions Ltd.",
          targetProduct: "Purified Aspirin API",
          orderDate: "2025-02-10",
          completionDate: "2025-03-10",
          status: "pending",
          totalCost: 28000,
          revenue: 36400,
          profit: 8400,
          rawMaterials: ["Raw Aspirin Extract", "Recrystallization Solvent", "Activated Carbon"],
          additionalCosts: {
            transportation: 1500,
            labor: 2200,
            equipment: 1300,
            qualityControl: 800,
            storage: 500
          }
        },
        {
          id: 5,
          orderNumber: "ORD-PHM-2025-005",
          batchNumber: "BATCH-VIT-005",
          type: "manufacturing",
          customerName: "Health Plus Pharmacy",
          customerCompany: "Health Plus Pharmacy Chain",
          targetProduct: "Vitamin C Tablets 1000mg",
          orderDate: "2025-02-15",
          completionDate: "2025-03-15",
          status: "in-progress",
          totalCost: 15000,
          revenue: 21000,
          profit: 6000,
          rawMaterials: ["L-Ascorbic Acid", "Sodium Bicarbonate", "Orange Flavoring", "Citric Acid"],
          additionalCosts: {
            transportation: 800,
            labor: 1200,
            equipment: 700,
            qualityControl: 400,
            storage: 300
          }
        }
      ];

      res.json(pharmaceuticalOrderHistory);
    } catch (error) {
      console.error("Error fetching production order history:", error);
      res.status(500).json({ message: "Failed to fetch production order history" });
    }
  });

  // Generate sales report
  app.get("/api/reports/sales", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const report = await storage.getSalesReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate sales report" });
    }
  });

  // ============= Backup Endpoints =============

  // Get all backups
  app.get("/api/backups", async (req: Request, res: Response) => {
    try {
      const backups = await storage.getBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch backups" });
    }
  });

  // Get latest backup
  app.get("/api/backups/latest", async (req: Request, res: Response) => {
    try {
      const backup = await storage.getLatestBackup();

      if (!backup) {
        return res.status(404).json({ message: "No backups found" });
      }

      res.json(backup);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest backup" });
    }
  });

  // Create manual backup
  app.post("/api/backups", async (req: Request, res: Response) => {
    try {
      const { type = "manual" } = req.body;
      const backup = await storage.performBackup(type);
      res.status(201).json(backup);
    } catch (error) {
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  // Restore from backup
  app.post("/api/backups/:id/restore", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.restoreFromBackup(id);

      if (!success) {
        return res.status(400).json({ message: "Failed to restore from backup" });
      }

      res.json({ message: "Successfully restored from backup" });
    } catch (error) {
      res.status(500).json({ message: "Failed to restore from backup" });
    }
  });

  // Get backup settings
  app.get("/api/backup-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getBackupSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch backup settings" });
    }
  });

  // Update backup settings
  app.patch("/api/backup-settings", async (req: Request, res: Response) => {
    try {
      const validatedData = updateBackupSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateBackupSettings(validatedData);

      // Reconfigure automatic backups after settings update
      setupAutomaticBackups();

      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update backup settings" });
    }
  });

  // ============= Financial Integration Status Endpoint =============

  // Get financial integration status with real data
  app.get("/api/financial-integration/status", async (req: Request, res: Response) => {
    try {
      // Check database connection health
      let dbStatus = 'active';
      let integrationStatus = 'connected';
      let lastSync = null;
      let summary = {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0
      };

      try {
        // Test database connection
        await db.execute('SELECT 1');
        
        // Check if required accounting tables exist and have data
        const accountsCount = await db.execute('SELECT COUNT(*) as count FROM accounts');
        const journalEntriesCount = await db.execute('SELECT COUNT(*) as count FROM journal_entries');
        
        if (Number(accountsCount.rows[0]?.count || 0) === 0) {
          integrationStatus = 'disconnected';
        }

        // Get last sync timestamp from most recent journal entry
        const lastJournalEntry = await db.execute(`
          SELECT created_at 
          FROM journal_entries 
          ORDER BY created_at DESC 
          LIMIT 1
        `);
        
        if (lastJournalEntry.rows.length > 0) {
          lastSync = lastJournalEntry.rows[0].created_at;
        }

        // Get real financial summary
        const revenueResult = await db.execute(`
          SELECT COALESCE(SUM(CAST(total AS NUMERIC)), 0) as total_revenue
          FROM sales 
          WHERE status != 'cancelled'
        `);

        const expensesResult = await db.execute(`
          SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total_expenses
          FROM expenses
        `);

        summary.totalRevenue = Number(revenueResult.rows[0]?.total_revenue || 0);
        summary.totalExpenses = Number(expensesResult.rows[0]?.total_expenses || 0);
        summary.netProfit = summary.totalRevenue - summary.totalExpenses;

      } catch (dbError) {
        console.error('Database connection check failed:', dbError);
        dbStatus = 'error';
        integrationStatus = 'disconnected';
      }

      const response = {
        status: dbStatus,
        accountingIntegration: integrationStatus,
        lastSync: lastSync,
        summary: summary,
        timestamp: new Date().toISOString(),
        features: {
          journalEntries: integrationStatus === 'connected',
          autoAccounting: integrationStatus === 'connected',
          reportGeneration: true
        }
      };

      res.json(response);
    } catch (error) {
      console.error("Failed to fetch financial integration status:", error);
      res.status(500).json({ 
        status: 'error',
        accountingIntegration: 'disconnected',
        lastSync: null,
        summary: { totalRevenue: 0, totalExpenses: 0, netProfit: 0 },
        message: "Failed to fetch integration status" 
      });
    }
  });

  // ============= Expense Categories Endpoints =============

  // Get all expense categories
  app.get("/api/expense-categories", async (req: Request, res: Response) => {
    try {
      const categories = await db.select().from(expenseCategories).orderBy(expenseCategories.name);
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch expense categories:", error);
      res.status(500).json({ message: "Failed to fetch expense categories" });
    }
  });

  // Get expense category by ID
  app.get("/api/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const [category] = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
      
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Failed to fetch expense category:", error);
      res.status(500).json({ message: "Failed to fetch expense category" });
    }
  });

  // Create new expense category
  app.post("/api/expense-categories", async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      const [category] = await db.insert(expenseCategories).values({
        name,
        description
      }).returning();
      
      res.status(201).json(category);
    } catch (error) {
      console.error("Failed to create expense category:", error);
      res.status(500).json({ message: "Failed to create expense category" });
    }
  });

  // Update expense category
  app.put("/api/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      const [category] = await db.update(expenseCategories)
        .set({ name, description })
        .where(eq(expenseCategories.id, id))
        .returning();
      
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Failed to update expense category:", error);
      res.status(500).json({ message: "Failed to update expense category" });
    }
  });

  // Delete expense category
  app.delete("/api/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Check if category is used by any expenses
      const expensesWithCategory = await db.select().from(expenses).where(eq(expenses.category, String(id))).limit(1);
      
      if (expensesWithCategory.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category because it's used by existing expenses" 
        });
      }
      
      const [deletedCategory] = await db.delete(expenseCategories)
        .where(eq(expenseCategories.id, id))
        .returning();
      
      if (!deletedCategory) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      
      res.json({ message: "Expense category deleted successfully" });
    } catch (error) {
      console.error("Failed to delete expense category:", error);
      res.status(500).json({ message: "Failed to delete expense category" });
    }
  });

  // ============= System Preferences Endpoints =============

  // Middleware to check admin role
  const isAdmin = (req: Request, res: Response, next: Function) => {
    // Check if user is authenticated and is an admin
    // For now, we'll just pass through since auth isn't fully implemented
    // In production, use JWT token verification

    // Example:
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ message: "Access denied. Admin privileges required." });
    // }

    next();
  };

  // Get all system preferences
  app.get("/api/system-preferences", isAdmin, async (req: Request, res: Response) => {
    try {
      const preferences = await storage.getSystemPreferences();
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system preferences" });
    }
  });

  // Get system preferences by category
  app.get("/api/system-preferences/category/:category", isAdmin, async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const preferences = await storage.getSystemPreferencesByCategory(category);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system preferences" });
    }
  });

  // Get a specific system preference
  app.get("/api/system-preferences/:key", isAdmin, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const preference = await storage.getSystemPreference(key);

      if (!preference) {
        return res.status(404).json({ message: "System preference not found" });
      }

      res.json(preference);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system preference" });
    }
  });

  // Create a new system preference
  app.post("/api/system-preferences", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSystemPreferenceSchema.parse(req.body);
      const preference = await storage.createSystemPreference(validatedData);
      res.status(201).json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid system preference data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create system preference" });
    }
  });

  // Update a system preference
  app.patch("/api/system-preferences/:key", isAdmin, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const { value } = updateSystemPreferenceSchema.parse(req.body);

      const preference = await storage.updateSystemPreference(key, value);

      if (!preference) {
        return res.status(404).json({ message: "System preference not found" });
      }

      res.json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid system preference data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update system preference" });
    }
  });

  // ============= Role Permissions Endpoints =============

  // Get permissions for a role
  app.get("/api/role-permissions/:role", isAdmin, async (req: Request, res: Response) => {
    try {
      const role = req.params.role;
      const permissions = await storage.getRolePermissions(role);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  // Create a new role permission
  app.post("/api/role-permissions", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertRolePermissionSchema.parse(req.body);
      const permission = await storage.createRolePermission(validatedData);
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role permission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create role permission" });
    }
  });

  // Delete a role permission
  app.delete("/api/role-permissions/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteRolePermission(id);

      if (!success) {
        return res.status(404).json({ message: "Role permission not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete role permission" });
    }
  });

  // ============= Login Logs Endpoints =============

  // Get login logs
  app.get("/api/login-logs", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const logs = await storage.getLoginLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch login logs" });
    }
  });

  // Create a new login log
  app.post("/api/login-logs", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLoginLogSchema.parse(req.body);
      const log = await storage.createLoginLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login log data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create login log" });
    }
  });

  // ============= Order Management Endpoints =============
  
  // In-memory storage for generated orders
  let generatedOrdersStorage: any[] = [];

  // Get all orders
  app.post("/api/orders/generate-sample", async (req: Request, res: Response) => {
    try {
      const { count = 5 } = req.body;
      const generatedOrders = [];

      const sampleCustomers = [
        { name: "Cairo Pharmaceuticals", company: "Cairo Pharma Ltd", sector: "Healthcare" },
        { name: "Alexandria Medical", company: "Alex Medical Co", sector: "Medical Supplies" },
        { name: "Giza Chemical Industries", company: "Giza Chemicals", sector: "Chemical Manufacturing" },
        { name: "Suez Biotech", company: "Suez Biotech Solutions", sector: "Biotechnology" },
        { name: "Luxor Research Labs", company: "Luxor Research", sector: "R&D" }
      ];

      const sampleProducts = [
        "Acetylsalicylic Acid Tablets",
        "Paracetamol Suspension", 
        "Amoxicillin Capsules",
        "Ibuprofen Tablets",
        "Omeprazole Capsules"
      ];

      // Add the generated orders directly to the existing mock orders array
      for (let i = 0; i < count; i++) {
        const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
        const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        const orderType = Math.random() > 0.5 ? 'production' : 'refining';
        const status = ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)];
        const cost = (Math.random() * 50000 + 10000).toFixed(2);
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        const batchNumber = orderType === 'production' 
          ? `PROD-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}-${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
          : `REF-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}-${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

        const newOrder = {
          id: Date.now() + i,
          batchNumber,
          customerName: customer.name,
          customerCompany: customer.company,
          customerSector: customer.sector,
          finalProduct: product,
          totalCost: cost,
          status,
          orderType,
          createdAt: date.toISOString(),
          rawMaterials: JSON.stringify([
            { name: "Sulfuric Acid", quantity: Math.floor(Math.random() * 100) + 10, unit: "kg" },
            { name: "Sodium Hydroxide", quantity: Math.floor(Math.random() * 50) + 5, unit: "kg" }
          ])
        };

        // Store in persistent memory
        generatedOrdersStorage.push(newOrder);
        generatedOrders.push(newOrder);
      }

      res.json({ 
        success: true, 
        message: `Generated ${count} sample orders successfully`,
        orders: generatedOrders 
      });
    } catch (error) {
      console.error('Error generating sample orders:', error);
      res.status(500).json({ error: 'Failed to generate sample orders' });
    }
  });

  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string || '';
      const orderType = req.query.orderType as string || '';
      const status = req.query.status as string || '';

      try {
        const orders = await storage.getOrders(query, orderType, status);
        res.json([...orders, ...generatedOrdersStorage]);
      } catch (storageError) {
        console.error("Error fetching orders from storage:", storageError);

        // Enhanced chemical orders with real pharmaceutical compounds
        const mockOrders = [...generatedOrdersStorage,
          {
            id: 1,
            orderType: 'production',
            batchNumber: 'ADPH-001-250523',
            customerId: 3,
            customerName: 'Advanced Pharmaceuticals Ltd',
            finalProduct: 'Ibuprofen Active Ingredient',
            materials: JSON.stringify([
              {
                id: 18,
                name: 'Isobutylbenzene',
                quantity: 100,
                unitPrice: '85.00',
                unitOfMeasure: 'L'
              },
              {
                id: 19,
                name: 'Acetyl Chloride',
                quantity: 60,
                unitPrice: '72.50',
                unitOfMeasure: 'L'
              },
              {
                id: 20,
                name: 'Aluminum Chloride',
                quantity: 25,
                unitPrice: '95.00',
                unitOfMeasure: 'kg'
              }
            ]),
            subtotal: '14225.00',
            taxPercentage: 14,
            taxAmount: '1991.50',
            totalMaterialCost: '14225.00',
            totalAdditionalFees: '1991.50',
            totalCost: '16216.50',
            status: 'completed',
            createdAt: '2025-05-23T08:30:00Z'
          },
          {
            id: 2,
            orderType: 'production',
            batchNumber: 'BTIO-002-250523',
            customerId: 4,
            customerName: 'BioTech Innovations',
            finalProduct: 'Amoxicillin Trihydrate',
            materials: JSON.stringify([
              {
                id: 21,
                name: '6-Aminopenicillanic Acid',
                quantity: 40,
                unitPrice: '185.00',
                unitOfMeasure: 'kg'
              },
              {
                id: 22,
                name: 'p-Hydroxybenzaldehyde',
                quantity: 30,
                unitPrice: '95.50',
                unitOfMeasure: 'kg'
              },
              {
                id: 23,
                name: 'Triethylamine',
                quantity: 20,
                unitPrice: '55.00',
                unitOfMeasure: 'L'
              }
            ]),
            subtotal: '11665.00',
            taxPercentage: 14,
            taxAmount: '1633.10',
            totalMaterialCost: '11665.00',
            totalAdditionalFees: '1633.10',
            totalCost: '13298.10',
            status: 'in_progress',
            createdAt: '2025-05-23T10:15:00Z'
          },
          {
            id: 3,
            orderType: 'refining',
            batchNumber: 'PURE-003-250523',
            customerId: 5,
            customerName: 'PureChem Industries',
            finalProduct: 'Refined Caffeine Anhydrous',
            materials: JSON.stringify([
              {
                id: 24,
                name: 'Crude Caffeine Extract',
                quantity: 150,
                unitPrice: '28.00',
                unitOfMeasure: 'kg'
              },
              {
                id: 25,
                name: 'Activated Carbon',
                quantity: 25,
                unitPrice: '15.50',
                unitOfMeasure: 'kg'
              },
              {
                id: 26,
                name: 'Ethyl Acetate',
                quantity: 100,
                unitPrice: '22.75',
                unitOfMeasure: 'L'
              }
            ]),
            subtotal: '6962.50',
            taxPercentage: 14,
            taxAmount: '974.75',
            totalMaterialCost: '6962.50',
            totalAdditionalFees: '974.75',
            totalCost: '7937.25',
            status: 'pending',
            createdAt: '2025-05-23T11:30:00Z'
          },
          {
            id: 4,
            orderType: 'refining',
            batchNumber: 'CHEM-004-250523',
            customerId: 6,
            customerName: 'ChemLab Solutions',
            finalProduct: 'Purified Aspirin API',
            materials: JSON.stringify([
              {
                id: 27,
                name: 'Raw Aspirin Extract',
                quantity: 80,
                unitPrice: '42.00',
                unitOfMeasure: 'kg'
              },
              {
                id: 28,
                name: 'Recrystallization Solvent',
                quantity: 150,
                unitPrice: '18.50',
                unitOfMeasure: 'L'
              }
            ]),
            subtotal: '6135.00',
            taxPercentage: 14,
            taxAmount: '858.90',
            totalMaterialCost: '6135.00',
            totalAdditionalFees: '858.90',
            totalCost: '6993.90',
            status: 'completed',
            createdAt: '2025-05-23T13:15:00Z'
          },
          {
            id: 5,
            orderType: 'production',
            batchNumber: 'MEDSOL-005-250523',
            customerId: 1,
            customerName: 'MedPharma Solutions',
            finalProduct: 'Acetylsalicylic Acid Tablets (Aspirin)',
            materials: JSON.stringify([
              {
                id: 12,
                name: 'Salicylic Acid',
                quantity: 50,
                unitPrice: '45.00',
                unitOfMeasure: 'kg'
              },
              {
                id: 13,
                name: 'Acetic Anhydride',
                quantity: 25,
                unitPrice: '38.50',
                unitOfMeasure: 'L'
              },
              {
                id: 14,
                name: 'Phosphoric Acid Catalyst',
                quantity: 2,
                unitPrice: '120.00',
                unitOfMeasure: 'kg'
              }
            ]),
            subtotal: '3452.50',
            taxPercentage: 14,
            taxAmount: '483.35',
            totalMaterialCost: '3452.50',
            totalAdditionalFees: '483.35',
            totalCost: '3935.85',
            status: 'pending',
            createdAt: '2025-05-23T14:45:00Z'
          },
          {
            id: 6,
            orderType: 'production',
            batchNumber: 'GLOB-006-250523',
            customerId: 2,
            customerName: 'Global Health Industries',
            finalProduct: 'Paracetamol (Acetaminophen) Powder',
            materials: JSON.stringify([
              {
                id: 15,
                name: 'p-Aminophenol',
                quantity: 75,
                unitPrice: '62.00',
                unitOfMeasure: 'kg'
              },
              {
                id: 16,
                name: 'Acetic Acid',
                quantity: 40,
                unitPrice: '28.75',
                unitOfMeasure: 'L'
              },
              {
                id: 17,
                name: 'Sodium Acetate',
                quantity: 15,
                unitPrice: '45.50',
                unitOfMeasure: 'kg'
              }
            ]),
            subtotal: '6482.50',
            taxPercentage: 14,
            taxAmount: '907.55',
            totalMaterialCost: '6482.50',
            totalAdditionalFees: '907.55',
            totalCost: '7390.05',
            status: 'in_progress',
            createdAt: '2025-05-23T16:00:00Z'
          }
        ];

        console.log("Returning mock chemical orders data");
        res.json(mockOrders);
      }
    } catch (error) {
      console.error("Error in orders endpoint:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get latest batch number for orders
  app.get("/api/orders/latest-batch", async (req: Request, res: Response) => {
    try {
      // Return latest batch numbers for production and refining
      const latestBatch = {
        production: 'CHEM-005-250207',
        refining: 'REF-003-250207'
      };
      
      res.json(latestBatch);
    } catch (error) {
      console.error("Error fetching latest batch:", error);
      res.status(500).json({ message: "Failed to fetch latest batch" });
    }
  });
              {
                id: 16,
                name: 'Calcium Carbonate',
                quantity: 120,
                unitPrice: '0.50',
                unitOfMeasure: 'kg'
              }
            ]),
            subtotal: '270.00',
            taxPercentage: 14,
            taxAmount: '37.80',
            totalMaterialCost: '270.00',
            totalAdditionalFees: '37.80',
            totalCost: '307.80',
            status: 'in_progress',
            createdAt: '2025-04-25T09:15:00Z'
          }
        ];

        res.json(mockOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get the latest batch number
  app.get("/api/orders/latest-batch", async (req: Request, res: Response) => {
    try {
      // Query for production orders (BATCH-XXXX)
      const productionQuery = `
        SELECT batch_number, "batchNumber", order_number, "orderNumber"
        FROM orders 
        WHERE batch_number LIKE 'BATCH-%' 
           OR "batchNumber" LIKE 'BATCH-%'
           OR order_number LIKE 'BATCH-%'
           OR "orderNumber" LIKE 'BATCH-%'
        ORDER BY id DESC 
        LIMIT 1
      `;

      // Query for refining orders (REF-XXXX)
      const refiningQuery = `
        SELECT batch_number, "batchNumber", order_number, "orderNumber"
        FROM orders 
        WHERE batch_number LIKE 'REF-%' 
           OR "batchNumber" LIKE 'REF-%'
           OR order_number LIKE 'REF-%'
           OR "orderNumber" LIKE 'REF-%'
        ORDER BY id DESC 
        LIMIT 1
      `;

      let latestProductionBatch = 'BATCH-0000';
      let latestRefiningBatch = 'REF-0000';

      try {
        // Try to get latest production batch
        const productionResult = await pool.query(productionQuery);
        if (productionResult.rows.length > 0) {
          const row = productionResult.rows[0];
          latestProductionBatch = row.batch_number || row.batchNumber || row.order_number || row.orderNumber || 'BATCH-0000';
        }

        // Try to get latest refining batch
        const refiningResult = await pool.query(refiningQuery);
        if (refiningResult.rows.length > 0) {
          const row = refiningResult.rows[0];
          latestRefiningBatch = row.batch_number || row.batchNumber || row.order_number || row.orderNumber || 'REF-0000';
        }
      } catch (dbError) {
        console.error("Database error fetching batch numbers:", dbError);
        // Will continue with default values
      }

      // Return both batch numbers
      res.json({ 
        latestBatch: latestProductionBatch,
        latestRefiningBatch: latestRefiningBatch
      });
    } catch (error) {
      console.error("Error fetching latest batch:", error);
      res.status(500).json({ 
        message: "Failed to fetch latest batch number", 
        error: String(error),
        latestBatch: 'BATCH-0000',
        latestRefiningBatch: 'REF-0000'
      });
    }
  });

  // Get order by ID
  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const order = await storage.getOrder(id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Create new order
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      // Format order data with custom batch/order number
      let orderNumber;
      if (req.body.batchNumber && req.body.batchNumber.trim()) {
        // If batch number is provided, use it
        orderNumber = req.body.batchNumber;
      } else if (req.body.orderType === 'production') {
        // Generate a production-specific order number
        orderNumber = `PROD-${Date.now().toString().slice(-6)}`;
      } else if (req.body.orderType === 'refining') {
        // Generate a refining-specific order number
        orderNumber = `REF-${Date.now().toString().slice(-6)}`;
      } else {
        // Default order number format
        orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      }

      const orderData = {
        orderNumber,
        orderType: req.body.orderType,
        customerId: req.body.customerId,
        customerName: req.body.customerName, // Store customer name for easier display
        userId: 1, // Temp hardcoded user ID 
        description: req.body.description || '',
        productDescription: req.body.productDescription || '', // For production orders
        finalProduct: req.body.finalProduct || '', // For production orders - description of target
        sourceMaterial: req.body.sourceMaterial || '', // For refining orders
        materials: req.body.materials ? JSON.stringify(req.body.materials) : null, // Store materials as JSON
        totalMaterialCost: req.body.totalMaterialCost ? req.body.totalMaterialCost.toString() : '0',
        totalAdditionalFees: req.body.totalAdditionalFees ? req.body.totalAdditionalFees.toString() : '0',
        totalCost: req.body.totalCost.toString(),
        status: 'pending',
        targetProductId: req.body.targetProductId || null,
        expectedOutputQuantity: req.body.expectedOutputQuantity ? req.body.expectedOutputQuantity.toString() : null,
        refiningSteps: req.body.refiningSteps || null,
        createdAt: new Date().toISOString()
      };

      // Validate order data
      const validatedOrder = insertOrderSchema.parse(orderData);

      // Create order
      const order = await storage.createOrder(validatedOrder);

      // ============= INVENTORY VALIDATION AND DEDUCTION =============
      
      // Validate stock availability for all items before processing
      const stockValidation = [];
      const inventoryDeductions = [];
      
      if (req.body.items && req.body.items.length > 0) {
        // First, validate stock availability for all items
        for (const item of req.body.items) {
          if (item.productId && item.quantity) {
            const stockCheck = await db
              .select({
                warehouseId: warehouseInventory.warehouseId,
                warehouseName: warehouses.name,
                quantity: warehouseInventory.quantity,
                reservedQuantity: warehouseInventory.reservedQuantity,
                availableQuantity: sql`${warehouseInventory.quantity} - ${warehouseInventory.reservedQuantity}`.mapWith(Number)
              })
              .from(warehouseInventory)
              .innerJoin(warehouses, eq(warehouses.id, warehouseInventory.warehouseId))
              .where(eq(warehouseInventory.productId, item.productId));

            const availableStock = stockCheck.reduce((sum, stock) => sum + stock.availableQuantity, 0);
            const requiredQuantity = parseFloat(item.quantity);
            
            if (availableStock < requiredQuantity) {
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for Product ID ${item.productId}. Required: ${requiredQuantity}, Available: ${availableStock}`,
                error: 'INSUFFICIENT_STOCK',
                stockDetails: {
                  productId: item.productId,
                  required: requiredQuantity,
                  available: availableStock,
                  warehouseDetails: stockCheck
                }
              });
            }
            
            stockValidation.push({
              productId: item.productId,
              quantity: requiredQuantity,
              availableStock,
              warehouseDetails: stockCheck
            });
          }
        }
        
        console.log('✅ STOCK VALIDATION PASSED for all order items');
        
        // Reserve inventory for all items
        for (const validation of stockValidation) {
          let remainingQuantity = validation.quantity;
          const itemDeductions = [];
          
          for (const warehouse of validation.warehouseDetails) {
            if (remainingQuantity <= 0) break;
            
            const deductFromWarehouse = Math.min(remainingQuantity, warehouse.availableQuantity);
            
            if (deductFromWarehouse > 0) {
              await db
                .update(warehouseInventory)
                .set({
                  reservedQuantity: sql`${warehouseInventory.reservedQuantity} + ${deductFromWarehouse}`,
                  lastUpdated: new Date(),
                  updatedBy: 1 // TODO: Get from session
                })
                .where(and(
                  eq(warehouseInventory.productId, validation.productId),
                  eq(warehouseInventory.warehouseId, warehouse.warehouseId)
                ));

              itemDeductions.push({
                warehouseId: warehouse.warehouseId,
                warehouseName: warehouse.warehouseName,
                quantityDeducted: deductFromWarehouse
              });

              remainingQuantity -= deductFromWarehouse;
            }
          }
          
          inventoryDeductions.push({
            productId: validation.productId,
            quantity: validation.quantity,
            deductions: itemDeductions
          });
        }
        
        console.log('✅ INVENTORY RESERVED successfully for all order items:', inventoryDeductions);
        
        // Process order items
        for (const item of req.body.items) {
          const itemData = {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity.toString(),
            unitCost: item.unitCost.toString(),
            subtotal: item.subtotal.toString()
          };

          const validatedItem = insertOrderItemSchema.parse(itemData);
          await storage.createOrderItem(validatedItem);
        }
      }

      // Process additional fees
      if (req.body.fees && req.body.fees.length > 0) {
        for (const fee of req.body.fees) {
          const feeData = {
            orderId: order.id,
            feeLabel: fee.label,
            amount: fee.amount.toString()
          };

          const validatedFee = insertOrderFeeSchema.parse(feeData);
          await storage.createOrderFee(validatedFee);
        }
      }

      res.status(201).json({
        ...order,
        items: req.body.items,
        fees: req.body.fees
      });
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Update order status
  app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      // Get order details and items for inventory management
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Handle inventory deduction confirmation when order is completed
      if (status === 'completed' && order.status !== 'completed') {
        const orderItems = await storage.getOrderItems(id);
        
        console.log('🔥 ORDER COMPLETED - Confirming inventory deductions for order:', id);
        
        for (const item of orderItems) {
          try {
            // Get warehouses that have reserved stock for this product
            const warehouseStock = await db
              .select({
                warehouseId: warehouseInventory.warehouseId,
                warehouseName: warehouses.name,
                quantity: warehouseInventory.quantity,
                reservedQuantity: warehouseInventory.reservedQuantity
              })
              .from(warehouseInventory)
              .innerJoin(warehouses, eq(warehouses.id, warehouseInventory.warehouseId))
              .where(and(
                eq(warehouseInventory.productId, item.productId),
                sql`${warehouseInventory.reservedQuantity} > 0`
              ));

            let remainingQuantity = parseFloat(item.quantity);
            
            for (const warehouse of warehouseStock) {
              if (remainingQuantity <= 0) break;
              
              const deductFromWarehouse = Math.min(remainingQuantity, warehouse.reservedQuantity);
              
              if (deductFromWarehouse > 0) {
                // Convert reserved quantity to actual deduction
                await db
                  .update(warehouseInventory)
                  .set({
                    quantity: sql`${warehouseInventory.quantity} - ${deductFromWarehouse}`,
                    reservedQuantity: sql`${warehouseInventory.reservedQuantity} - ${deductFromWarehouse}`,
                    lastUpdated: new Date(),
                    updatedBy: 1 // TODO: Get from session
                  })
                  .where(and(
                    eq(warehouseInventory.productId, item.productId),
                    eq(warehouseInventory.warehouseId, warehouse.warehouseId)
                  ));

                console.log(`✅ INVENTORY CONFIRMED: Product ${item.productId} - ${deductFromWarehouse} units deducted from ${warehouse.warehouseName}`);
                remainingQuantity -= deductFromWarehouse;
              }
            }
          } catch (inventoryError) {
            console.error(`Error confirming inventory for product ${item.productId}:`, inventoryError);
            // Continue with other items even if one fails
          }
        }
      }

      // Handle inventory release when order is cancelled
      if (status === 'cancelled' && order.status !== 'cancelled') {
        const orderItems = await storage.getOrderItems(id);
        
        console.log('🔥 ORDER CANCELLED - Releasing reserved inventory for order:', id);
        
        for (const item of orderItems) {
          try {
            // Release all reserved inventory for this product
            await db
              .update(warehouseInventory)
              .set({
                reservedQuantity: sql`GREATEST(0, ${warehouseInventory.reservedQuantity} - ${parseFloat(item.quantity)})`,
                lastUpdated: new Date(),
                updatedBy: 1
              })
              .where(eq(warehouseInventory.productId, item.productId));

            console.log(`✅ INVENTORY RELEASED: Product ${item.productId} - ${item.quantity} units released from reservation`);
          } catch (inventoryError) {
            console.error(`Error releasing inventory for product ${item.productId}:`, inventoryError);
          }
        }
      }

      // Update order status
      const updatedOrder = await storage.updateOrder(id, { status });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteOrder(id);

      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Simple test endpoint to check database connectivity
  app.get("/api/test-db", async (req: Request, res: Response) => {
    try {
      console.log("Testing database connectivity");

      // Test basic query
      const { rows: allRows } = await pool.query('SELECT * FROM products LIMIT 3');
      console.log("Database test successful, found products:", allRows.length);

      // Test specific query for raw materials
      const { rows: rawRows } = await pool.query('SELECT * FROM products WHERE product_type = $1', ['raw']);
      console.log("Raw materials found via direct query:", rawRows.length, rawRows);

      // Also try using Drizzle ORM
      const drizzleProducts = await db.select().from(products);
      console.log("Drizzle products count:", drizzleProducts.length);

      // Filter for raw products using JavaScript
      const rawProducts = drizzleProducts.filter(p => p.productType === 'raw');
      console.log("Raw products after JS filtering:", rawProducts.length, rawProducts);

      res.json({ 
        success: true, 
        queryProducts: allRows,
        rawQueryProducts: rawRows,
        drizzleProducts: drizzleProducts.slice(0, 3),
        rawDrizzleProducts: rawProducts
      });
    } catch (error) {
      console.error("Error testing database:", error);
      res.status(500).json({ message: "Database test failed", error: String(error) });
    }
  });

  // Get raw materials (for production orders)
  app.get("/api/products/raw-materials", (req: Request, res: Response) => {
    try {
      console.log("Fetching raw materials for chemical orders");

      // Sample raw materials data for chemical orders
      const sampleRawMaterials = [
        {
          id: 101,
          name: "Sulfuric Acid",
          drugName: "H2SO4",
          description: "Strong mineral acid with many industrial applications",
          sku: "RAW-001",
          costPrice: "120.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 500,
          unitOfMeasure: "L"
        },
        {
          id: 102,
          name: "Sodium Hydroxide",
          drugName: "NaOH",
          description: "Highly caustic base and alkali salt",
          sku: "RAW-002",
          costPrice: "150.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 350,
          unitOfMeasure: "kg"
        },
        ```text
        {
          id: 103,
          name: "Ethanol",
          drugName: "C2H5OH",
          description: "Primary alcohol used as a solvent",
          sku: "RAW-003",
          costPrice: "95.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 200,
          unitOfMeasure: "L"
        },
        {
          id: 104,
          name: "Hydrochloric Acid",
          drugName: "HCl",
          description: "Strong acid with applications in laboratory and industrial settings",
          sku: "RAW-004",
          costPrice: "110.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 300,
          unitOfMeasure: "L"
        },
        {
          id: 105,
          name: "Citric Acid",
          drugName: "C6H8O7",
          description: "Weak organic acid found in citrus fruits, used as preservative and flavoring",
          sku: "RAW-005",
          costPrice: "85.00",
          sellingPrice: "0.00",
          productType: "raw",
          status: "active",
          quantity: 250,
          unitOfMeasure: "kg"
        }
      ];

      res.json(sampleRawMaterials);

    } catch (error) {
      console.error("Error fetching raw materials:", error);
      res.status(500).json({ message: "Failed to fetch raw materials", error: String(error) });
    }
  });

  // Get semi-finished products (for refining orders)
  app.get("/api/products/semi-finished", (req: Request, res: Response) => {
    try {
      console.log("Fetching semi-finished products for chemical orders");
      // Data for chemical intermediate products
      console.log("Providing chemical semi-finished products data");
      const sampleSemiFinishedProducts = [
        {
          id: 201,
          name: "Acetylsalicylic Acid Solution",
          drugName: "C9H8O4 Solution",
          description: "Semi-refined acetylsalicylic acid solution ready for final processing",
          sku: "SF-001",
          costPrice: "250.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 150,
          unitOfMeasure: "L",
          batchNumber: "CHEM-0001-250522"
        },
        {
          id: 202,
          name: "Paracetamol Base",
          drugName: "C8H9NO2 Base",
          description: "Partially processed paracetamol base compound",
          sku: "SF-002",
          costPrice: "220.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 100,
          unitOfMeasure: "kg",
          batchNumber: "CHEM-0002-250522"
        },
        {
          id: 203,
          name: "Caffeine Isolate",
          drugName: "C8H10N4O2 Isolate",
          description: "Purified caffeine extract in intermediate form",
          sku: "SF-003",
          costPrice: "280.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 75,
          unitOfMeasure: "kg",
          batchNumber: "CHEM-0003-250522"
        },
        {
          id: 204,
          name: "Diclofenac Sodium Base",
          drugName: "C14H10Cl2NNaO2 Base",
          description: "Semi-processed diclofenac sodium for pharmaceutical applications",
          sku: "SF-004",
          costPrice: "310.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 60,
          unitOfMeasure: "kg",
          batchNumber: "CHEM-0004-250522"
        },
        {
          id: 205,
          name: "Ibuprofen Intermediate",
          drugName: "C13H18O2 Intermediate",
          description: "Partially refined ibuprofen for anti-inflammatory medications",
          sku: "SF-005",
          costPrice: "245.00",
          sellingPrice: "0.00",
          productType: "semi-raw",
          status: "active",
          quantity: 120,
          unitOfMeasure: "kg",
          batchNumber: "CHEM-0005-250522"
        }
      ];

      res.json(sampleSemiFinishedProducts);

    } catch (error) {
      console.error("Error fetching semi-finished products:", error);
      res.status(500).json({ message: "Failed to fetch semi-finished products", error: String(error) });
    }
  });

  // Refunds API endpoint
  app.post("/api/refunds", async (req: Request, res: Response) => {
    try {
      const {
        invoiceId,
        invoiceNumber,
        customerId,
        customerName,
        originalAmount,
        refundAmount,
        reason,
        date,
        status
      } = req.body;

      // Validate required fields
      if (!invoiceId || !refundAmount || !reason) {
        return res.status(400).json({ 
          message: "Missing required fields: invoiceId, refundAmount, reason" 
        });
      }

      // Insert refund record
      const refundQuery = `
        INSERT INTO refunds (
          invoice_id, invoice_number, customer_id, customer_name,
          original_amount, refund_amount, reason, date, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;

      const refundResult = await pool.query(refundQuery, [
        invoiceId,
        invoiceNumber,
        customerId,
        customerName,
        originalAmount,
        refundAmount,
        reason,
        date,
        status
      ]);

      // Create journal entry for refund
      const journalEntryQuery = `
        INSERT INTO journal_entries (
          type, reference_number, description, total_amount, date, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `;

      const journalResult = await pool.query(journalEntryQuery, [
        'refund',
        invoiceNumber,
        `Refund for Invoice ${invoiceNumber} - ${reason}`,
        refundAmount,
        date
      ]);

      const journalEntryId = journalResult.rows[0].id;

      // Create journal entry lines for refund
      const journalLineQueries = [
        // Debit: Sales Returns and Allowances
        `INSERT INTO journal_entry_lines (
          journal_entry_id, account_id, account_name, debit, credit, description
        ) VALUES ($1, 22, 'Sales Returns and Allowances', $2, 0, $3)`,
        
        // Credit: Cash or Accounts Receivable
        `INSERT INTO journal_entry_lines (
          journal_entry_id, account_id, account_name, debit, credit, description
        ) VALUES ($1, 1, 'Cash', 0, $2, $3)`
      ];

      const lineDescription = `Refund for Invoice ${invoiceNumber}`;
      
      for (const query of journalLineQueries) {
        await pool.query(query, [journalEntryId, refundAmount, lineDescription]);
      }

      res.status(201).json({
        message: "Refund processed successfully",
        refund: refundResult.rows[0],
        journalEntryId
      });

    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ 
        message: "Failed to process refund", 
        error: String(error) 
      });
    }
  });

  // Get refunds for a specific invoice
  app.get("/api/refunds/invoice/:invoiceId", async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      
      const query = `
        SELECT * FROM refunds 
        WHERE invoice_id = $1 
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query, [invoiceId]);
      res.json(result.rows);
      
    } catch (error) {
      console.error("Error fetching refunds:", error);
      res.status(500).json({ 
        message: "Failed to fetch refunds", 
        error: String(error) 
      });
    }
  });

  return httpServer;
}

// Function to setup automatic backups
async function setupAutomaticBackups() {
  try {
    // Get current settings
    const settings = await storage.getBackupSettings();

    // Cancel any existing backup jobs
    for (const job of Object.values(cronJobs)) {
      if (job) job.stop();
    }

    // Set up daily backup if enabled
    if (settings.dailyBackup) {
      const [hour, minute] = settings.backupTime.split(':');
      cronJobs.daily = cron.schedule(`${minute} ${hour} * * *`, async () => {
        await storage.performBackup('daily');
        console.log('Daily backup completed');
      });
    }

    // Set up weekly backup if enabled
    if (settings.weeklyBackup) {
      const [hour, minute] = settings.backupTime.split(':');
      cronJobs.weekly = cron.schedule(`${minute} ${hour} * * 0`, async () => {
        await storage.performBackup('weekly');
        console.log('Weekly backup completed');
      });
    }

    // Set up monthly backup if enabled
    if (settings.monthlyBackup) {
      const [hour, minute] = settings.backupTime.split(':');
      cronJobs.monthly = cron.schedule(`${minute} ${hour} 1 * *`, async () => {
        await storage.performBackup('monthly');
        console.log('Monthly backup completed');
      });
    }
  } catch (error) {
    console.error('Failed to setup automatic backups:', error);
  }
}

// Store cron jobs so they can be stopped/updated
const cronJobs: Record<string, cron.ScheduledTask | null> = {
  daily: null,
  weekly: null,
  monthly: null
};