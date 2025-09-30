import { Router, Request, Response } from "express";
import { z } from "zod";
import { eq, count, desc, sql, and, gte, lte, or } from "drizzle-orm";
import { db } from "./db";
import { 
  customers, 
  sales, 
  orders,
  insertCustomerSchema,
  Customer, 
  InsertCustomer 
} from "@shared/schema";

const router = Router();

// ============= Customer CRUD Endpoints =============

// GET /api/v1/customers - Get all customers with optional filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    const { limit = "50", offset = "0", search, sector } = req.query;
    
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        sql`${customers.name} ILIKE ${'%' + search + '%'} OR ${customers.email} ILIKE ${'%' + search + '%'} OR ${customers.company} ILIKE ${'%' + search + '%'}`
      );
    }
    
    if (sector) {
      whereConditions.push(eq(customers.sector, sector as string));
    }
    
    let query = db.select().from(customers);
    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }
    
    const result = await query
      .orderBy(desc(customers.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

// GET /api/v1/customers/:id - Get customer by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customer = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    
    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer[0]);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ message: "Failed to fetch customer" });
  }
});

// POST /api/v1/customers - Create new customer
router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = insertCustomerSchema.parse(req.body);
    
    const [newCustomer] = await db.insert(customers)
      .values(validatedData)
      .returning();
    
    res.status(201).json(newCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid customer data", 
        errors: error.errors 
      });
    }
    console.error("Error creating customer:", error);
    res.status(500).json({ message: "Failed to create customer" });
  }
});

// PATCH /api/v1/customers/:id - Update customer
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const validatedData = insertCustomerSchema.partial().parse(req.body);
    
    const [updatedCustomer] = await db.update(customers)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(updatedCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid customer data", 
        errors: error.errors 
      });
    }
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Failed to update customer" });
  }
});

// DELETE /api/v1/customers/:id - Delete customer
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    // Check if customer has sales/orders before deletion
    const customerSales = await db.select({ count: count() })
      .from(sales)
      .where(eq(sales.customerId, id));
    
    const customerOrders = await db.select({ count: count() })
      .from(orders)
      .where(eq(orders.customerId, id));
    
    if (customerSales[0].count > 0 || customerOrders[0].count > 0) {
      return res.status(400).json({ 
        message: "Cannot delete customer with existing sales or orders" 
      });
    }

    const [deletedCustomer] = await db.delete(customers)
      .where(eq(customers.id, id))
      .returning();
    
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Failed to delete customer" });
  }
});

// ============= Customer Analytics & Reports =============

// GET /api/v1/customers/export - Export customers as CSV
router.get("/export", async (req: Request, res: Response) => {
  try {
    const { format = "csv" } = req.query;
    
    const allCustomers = await db.select().from(customers)
      .orderBy(desc(customers.createdAt));
    
    if (format === "csv") {
      const csvHeaders = "ID,Name,Email,Phone,Company,Position,Sector,Address,City,State,ZIP,Tax Number,Total Purchases,Created At,Updated At\n";
      const csvData = allCustomers.map(customer => [
        customer.id,
        `"${customer.name}"`,
        `"${customer.email || ''}"`,
        `"${customer.phone || ''}"`,
        `"${customer.company || ''}"`,
        `"${customer.position || ''}"`,
        `"${customer.sector || ''}"`,
        `"${customer.address || ''}"`,
        `"${customer.city || ''}"`,
        `"${customer.state || ''}"`,
        `"${customer.zipCode || ''}"`,
        `"${customer.taxNumber || ''}"`,
        customer.totalPurchases,
        customer.createdAt.toISOString(),
        customer.updatedAt.toISOString()
      ].join(",")).join("\n");
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customers_export.csv"');
      res.send(csvHeaders + csvData);
    } else {
      res.json(allCustomers);
    }
  } catch (error) {
    console.error("Error exporting customers:", error);
    res.status(500).json({ message: "Failed to export customers" });
  }
});

// ============= Customer ERP Integration Endpoints =============

// GET /api/v1/customers/:id/orders - Get customer orders
router.get("/:id/orders", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customerOrders = await db.select().from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt));
    
    res.json(customerOrders);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ message: "Failed to fetch customer orders" });
  }
});

// GET /api/v1/customers/:id/sales - Get customer sales
router.get("/:id/sales", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customerSales = await db.select().from(sales)
      .where(eq(sales.customerId, id))
      .orderBy(desc(sales.date));
    
    res.json(customerSales);
  } catch (error) {
    console.error("Error fetching customer sales:", error);
    res.status(500).json({ message: "Failed to fetch customer sales" });
  }
});

// GET /api/v1/customers/:id/summary - Get customer summary with totals
router.get("/:id/summary", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    // Get customer details
    const customer = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (customer.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Get sales summary
    const salesSummary = await db.select({
      totalSales: count(),
      totalRevenue: sql`COALESCE(SUM(${sales.grandTotal}), 0)`,
      lastSaleDate: sql`MAX(${sales.date})`
    }).from(sales).where(eq(sales.customerId, id));

    // Get orders summary  
    const ordersSummary = await db.select({
      totalOrders: count(),
      totalOrderValue: sql`COALESCE(SUM(${orders.totalAmount}), 0)`,
      lastOrderDate: sql`MAX(${orders.createdAt})`
    }).from(orders).where(eq(orders.customerId, id));

    res.json({
      customer: customer[0],
      sales: salesSummary[0],
      orders: ordersSummary[0]
    });
  } catch (error) {
    console.error("Error fetching customer summary:", error);
    res.status(500).json({ message: "Failed to fetch customer summary" });
  }
});

export default router;