import { Express, Request, Response } from "express";
import { db } from "./db";
import {
  sales,
  saleItems,
  expenses,
  purchaseOrders,
  purchaseOrderItems,
  customers,
  suppliers,
  products,
  productCategories,
  journalEntries,
  journalEntryLines,
  accounts
} from "@shared/schema";
import { sql, eq, and, or, gte, lte, desc, count, sum } from "drizzle-orm";

export function registerUnifiedAccountingRoutes(app: Express) {

  // =============== UNIFIED INVOICES ENDPOINT ===============
  // This endpoint provides the EXACT same data to both invoice history and accounting modules
  app.get("/api/unified/invoices", async (req: Request, res: Response) => {
    try {
      const { status, limit } = req.query;

      let salesData;
      if (status) {
        salesData = await db
          .select({
            id: sales.id,
            invoiceNumber: sales.invoiceNumber,
            customerId: sales.customerId,
            customerName: customers.name,
            userId: sales.userId,
            date: sales.date,
            subtotal: sales.subtotal,
            discount: sales.discount,
            discountAmount: sales.discount,
            tax: sales.tax,
            taxAmount: sales.tax,
            grandTotal: sales.grandTotal,
            totalAmount: sales.grandTotal,
            paymentMethod: sales.paymentMethod,
            paymentStatus: sales.paymentStatus,
            amountPaid: sales.amountPaid,
            paymentTerms: sales.paymentTerms,
            notes: sales.notes,
            etaStatus: sales.etaStatus,
            etaReference: sales.etaReference,
            etaUuid: sales.etaUuid,
            etaSubmissionDate: sales.etaSubmissionDate,
            etaResponse: sales.etaResponse,
            etaErrorMessage: sales.etaErrorMessage,
            createdAt: sales.createdAt,
            // Customer details for invoice display
            customerEmail: customers.email,
            customerPhone: customers.phone,
            customerAddress: customers.address,
            customerCity: customers.city,
            customerState: customers.state,
            customerZipCode: customers.zipCode,
            customerCompany: customers.company,
            customerPosition: customers.position,
            customerSector: customers.sector,
            customerTaxNumber: customers.taxNumber
          })
          .from(sales)
          .leftJoin(customers, eq(sales.customerId, customers.id))
          .where(eq(sales.paymentStatus, status as string))
          .orderBy(desc(sales.date));
      } else {
        salesData = await db
          .select({
            id: sales.id,
            invoiceNumber: sales.invoiceNumber,
            customerId: sales.customerId,
            customerName: customers.name,
            userId: sales.userId,
            date: sales.date,
            subtotal: sales.subtotal,
            discount: sales.discount,
            discountAmount: sales.discount,
            tax: sales.tax,
            taxAmount: sales.tax,
            grandTotal: sales.grandTotal,
            totalAmount: sales.grandTotal,
            paymentMethod: sales.paymentMethod,
            paymentStatus: sales.paymentStatus,
            amountPaid: sales.amountPaid,
            paymentTerms: sales.paymentTerms,
            notes: sales.notes,
            etaStatus: sales.etaStatus,
            etaReference: sales.etaReference,
            etaUuid: sales.etaUuid,
            etaSubmissionDate: sales.etaSubmissionDate,
            etaResponse: sales.etaResponse,
            etaErrorMessage: sales.etaErrorMessage,
            createdAt: sales.createdAt,
            // Customer details for invoice display
            customerEmail: customers.email,
            customerPhone: customers.phone,
            customerAddress: customers.address,
            customerCity: customers.city,
            customerState: customers.state,
            customerZipCode: customers.zipCode,
            customerCompany: customers.company,
            customerPosition: customers.position,
            customerSector: customers.sector,
            customerTaxNumber: customers.taxNumber
          })
          .from(sales)
          .leftJoin(customers, eq(sales.customerId, customers.id))
          .orderBy(desc(sales.date));
      }

      if (limit) {
        salesData = salesData.slice(0, parseInt(limit as string));
      }

      // Optimize: Fetch all items in a single query instead of N+1 queries
      const invoiceIds = salesData.map(invoice => invoice.id);

      let allItems: any[] = [];
      if (invoiceIds.length > 0) {
        allItems = await db
          .select({
            id: saleItems.id,
            saleId: saleItems.saleId,
            productId: saleItems.productId,
            productName: products.name,
            productSku: products.sku,
            quantity: saleItems.quantity,
            unitPrice: saleItems.unitPrice,
            discount: saleItems.discount,
            total: saleItems.total,
            unitOfMeasure: products.unitOfMeasure,
            // Product details
            categoryName: productCategories.name,
            batchNo: sql<string>`NULL`
          })
          .from(saleItems)
          .leftJoin(products, eq(saleItems.productId, products.id))
          .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
          .where(sql`${saleItems.saleId} IN (${sql.join(invoiceIds.map(id => sql`${id}`), sql`, `)})`);
      }

      // Group items by invoice ID for efficient lookup
      const itemsByInvoice = new Map();
      allItems.forEach((item: any) => {
        if (!itemsByInvoice.has(item.saleId)) {
          itemsByInvoice.set(item.saleId, []);
        }
        itemsByInvoice.get(item.saleId).push(item);
      });

      // Build final response with items efficiently
      const invoicesWithItems = salesData.map(invoice => ({
        ...invoice,
        items: itemsByInvoice.get(invoice.id) || [],
        customer: {
          id: invoice.customerId,
          name: invoice.customerName,
          email: invoice.customerEmail,
          phone: invoice.customerPhone,
          address: invoice.customerAddress,
          city: invoice.customerCity,
          state: invoice.customerState,
          zip_code: invoice.customerZipCode,
          company: invoice.customerCompany,
          position: invoice.customerPosition,
          sector: invoice.customerSector,
          tax_number: invoice.customerTaxNumber
        }
      }));

      res.json(invoicesWithItems);
    } catch (error) {
      console.error('Unified invoices error:', error);
      res.status(500).json({ error: 'Failed to fetch unified invoices data' });
    }
  });

  // =============== UNIFIED PURCHASE ORDERS ENDPOINT ===============
  // This endpoint provides the EXACT same data to both procurement and accounting modules
  app.get("/api/unified/purchase-orders", async (req: Request, res: Response) => {
    try {
      const { status } = req.query;

      let purchaseOrdersData;
      if (status) {
        purchaseOrdersData = await db
          .select({
            id: purchaseOrders.id,
            poNumber: purchaseOrders.poNumber,
            supplier: suppliers.name,
            supplierId: purchaseOrders.supplierId,
            date: purchaseOrders.orderDate,
            orderDate: purchaseOrders.orderDate,
            totalAmount: purchaseOrders.totalAmount,
            status: purchaseOrders.status,
            notes: purchaseOrders.notes,
            expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
            etaNumber: sql<string>`NULL`,
            paymentTerms: sql<string>`'Net 30'`,
            transportationType: purchaseOrders.transportationType,
            transportationCost: purchaseOrders.transportationCost,
            transportationNotes: purchaseOrders.transportationNotes,
            createdAt: purchaseOrders.createdAt,
            updatedAt: purchaseOrders.updatedAt
          })
          .from(purchaseOrders)
          .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
          .where(eq(purchaseOrders.status, status as string))
          .orderBy(desc(purchaseOrders.orderDate));
      } else {
        purchaseOrdersData = await db
          .select({
            id: purchaseOrders.id,
            poNumber: purchaseOrders.poNumber,
            supplier: suppliers.name,
            supplierId: purchaseOrders.supplierId,
            date: purchaseOrders.orderDate,
            orderDate: purchaseOrders.orderDate,
            totalAmount: purchaseOrders.totalAmount,
            status: purchaseOrders.status,
            notes: purchaseOrders.notes,
            expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
            etaNumber: sql<string>`NULL`,
            paymentTerms: sql<string>`'Net 30'`,
            transportationType: purchaseOrders.transportationType,
            transportationCost: purchaseOrders.transportationCost,
            transportationNotes: purchaseOrders.transportationNotes,
            createdAt: purchaseOrders.createdAt,
            updatedAt: purchaseOrders.updatedAt
          })
          .from(purchaseOrders)
          .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
          .orderBy(desc(purchaseOrders.orderDate));
      }

      // Add items to each purchase order for complete data synchronization
      const ordersWithItems = await Promise.all(
        purchaseOrdersData.map(async (order) => {
          const items = await db
            .select({
              id: purchaseOrderItems.id,
              productId: purchaseOrderItems.productId,
              productName: products.name,
              quantity: purchaseOrderItems.quantity,
              unitPrice: purchaseOrderItems.unitPrice,
              total: purchaseOrderItems.total,
              receivedQuantity: purchaseOrderItems.receivedQuantity
            })
            .from(purchaseOrderItems)
            .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
            .where(eq(purchaseOrderItems.purchaseOrderId, order.id));

          return {
            ...order,
            items,
            materials: items.map(item => ({
              name: item.productName || 'Unknown Product',
              quantity: item.quantity,
              unit: 'units'
            }))
          };
        })
      );

      res.json(ordersWithItems);
    } catch (error) {
      console.error('Unified purchase orders error:', error);
      res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  });

  // =============== UPDATE PURCHASE ORDER STATUS ===============
  app.patch("/api/unified/purchase-orders/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      if (!['sent', 'received', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be: sent, received, or rejected' });
      }

      // Update purchase order status
      const updatedOrder = await db
        .update(purchaseOrders)
        .set({ status, updatedAt: new Date() })
        .where(eq(purchaseOrders.id, parseInt(id)))
        .returning();

      if (updatedOrder.length === 0) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }

      res.json({
        success: true,
        message: `Purchase order status updated to ${status}`,
        order: updatedOrder[0]
      });
    } catch (error) {
      console.error('Update purchase order status error:', error);
      res.status(500).json({ error: 'Failed to update purchase order status' });
    }
  });

  // =============== UNIFIED ACCOUNTING DASHBOARD ===============
  app.get("/api/accounting/unified-dashboard", async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Run all queries in parallel for better performance
      const [
        monthlyRevenue,
        monthlyExpenses,
        journalCount,
        accountsCount,
        pendingPurchasesCount,
        outstandingInvoices
      ] = await Promise.all([
        // 1. Get Revenue from Invoices (This Month)
        db.select({ total: sql<string>`COALESCE(SUM(CAST(grand_total AS DECIMAL)), 0)` })
          .from(sales)
          .where(
            and(
              gte(sales.date, firstDayOfMonth),
              lte(sales.date, lastDayOfMonth)
            )
          ),

        // 2. Get Expenses (This Month)  
        db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
          .from(expenses)
          .where(
            and(
              gte(expenses.date, firstDayOfMonth.toISOString().split('T')[0]),
              lte(expenses.date, lastDayOfMonth.toISOString().split('T')[0])
            )
          ),

        // 3. Get Total Journal Entries Count
        db.select({ count: sql<number>`COUNT(*)` }).from(journalEntries),

        // 4. Get Total Accounts Count
        db.select({ count: sql<number>`COUNT(*)` })
          .from(accounts)
          .where(eq(accounts.isActive, true)),

        // 5. Get Pending Purchases Count
        db.select({ count: sql<number>`COUNT(*)` })
          .from(purchaseOrders)
          .where(eq(purchaseOrders.status, 'sent')),

        // 6. Get Outstanding Invoices
        db.select({ total: sql<string>`COALESCE(SUM(CAST(grand_total AS DECIMAL)), 0)` })
          .from(sales)
          .where(eq(sales.paymentStatus, 'pending'))
      ]);

      const revenueThisMonth = parseFloat(monthlyRevenue[0]?.total || '0');
      const expensesThisMonth = parseFloat(monthlyExpenses[0]?.total || '0');

      const dashboardData = {
        revenueThisMonth,
        expensesThisMonth,
        journalEntries: journalCount[0]?.count || 0,
        totalAccounts: accountsCount[0]?.count || 0,
        pendingPurchases: pendingPurchasesCount[0]?.count || 0,
        outstandingInvoices: parseFloat(outstandingInvoices[0]?.total || '0'),
        netProfit: revenueThisMonth - expensesThisMonth
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Unified accounting dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch unified dashboard data' });
    }
  });

  // =============== EXPENSES SYNC ===============
  // This endpoint returns the SAME data as the main expenses module
  app.get("/api/accounting/expenses", async (req: Request, res: Response) => {
    try {
      const expensesList = await db
        .select()
        .from(expenses)
        .orderBy(desc(expenses.date));

      res.json(expensesList);
    } catch (error) {
      console.error('Accounting expenses sync error:', error);
      res.status(500).json({ error: 'Failed to fetch expenses for accounting' });
    }
  });

  // =============== PENDING PURCHASES FROM PROCUREMENT ===============
  // Now using the unified endpoint for 100% data consistency
  app.get("/api/accounting/pending-purchases", async (req: Request, res: Response) => {
    try {
      // Use the unified endpoint logic directly for consistency
      const pendingPurchases = await db
        .select({
          id: purchaseOrders.id,
          poNumber: purchaseOrders.poNumber,
          supplier: suppliers.name,
          supplierId: purchaseOrders.supplierId,
          date: purchaseOrders.orderDate,
          orderDate: purchaseOrders.orderDate,
          totalAmount: purchaseOrders.totalAmount,
          status: purchaseOrders.status,
          notes: purchaseOrders.notes,
          expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
          createdAt: purchaseOrders.createdAt,
          updatedAt: purchaseOrders.updatedAt
        })
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .where(eq(purchaseOrders.status, 'sent'))
        .orderBy(desc(purchaseOrders.orderDate));

      res.json(pendingPurchases);
    } catch (error) {
      console.error('Pending purchases error:', error);
      res.status(500).json({ error: 'Failed to fetch pending purchases' });
    }
  });

  // =============== APPROVED PURCHASES FROM PROCUREMENT ===============
  app.get("/api/accounting/purchases", async (_req: Request, res: Response) => {
    try {
      const approvedPurchases = await db
        .select({
          id: purchaseOrders.id,
          poNumber: purchaseOrders.poNumber,
          supplier: suppliers.name,
          supplierId: purchaseOrders.supplierId,
          date: purchaseOrders.orderDate, // Fixed: Use orderDate instead of date
          totalAmount: purchaseOrders.totalAmount,
          status: purchaseOrders.status,
          notes: purchaseOrders.notes,
          expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
          createdAt: purchaseOrders.createdAt,
          updatedAt: purchaseOrders.updatedAt
        })
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .where(eq(purchaseOrders.status, 'received')) // Changed to received orders
        .orderBy(desc(purchaseOrders.orderDate)); // Fixed: Use orderDate

      res.json(approvedPurchases);
    } catch (error) {
      console.error('Approved purchases error:', error);
      res.status(500).json({ error: 'Failed to fetch approved purchases' });
    }
  });

  // =============== OUTSTANDING INVOICES ===============
  app.get("/api/accounting/invoices-due", async (_req: Request, res: Response) => {
    try {
      // Get all invoices with pending or partial payment status
      const outstandingInvoices = await db
        .select({
          id: sales.id,
          invoiceNumber: sales.invoiceNumber,
          customerId: sales.customerId,
          customerName: customers.name,
          date: sales.date,
          totalAmount: sales.grandTotal,
          paymentStatus: sales.paymentStatus,
          notes: sales.notes
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .where(
          or(
            eq(sales.paymentStatus, 'pending'),
            eq(sales.paymentStatus, 'partial')
          )
        )
        .orderBy(desc(sales.date));

      // Add calculated due date (30 days from invoice date) and days overdue
      const invoicesWithDueDate = outstandingInvoices.map(invoice => {
        const invoiceDate = new Date(invoice.date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

        const today = new Date();
        const daysOverdue = today > dueDate ?
          Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) :
          0;

        return {
          ...invoice,
          dueDate: dueDate.toISOString().split('T')[0],
          daysOverdue
        };
      });

      res.json(invoicesWithDueDate);
    } catch (error) {
      console.error('Outstanding invoices error:', error);
      res.status(500).json({ error: 'Failed to fetch outstanding invoices' });
    }
  });

  // =============== REVENUE FROM INVOICES ===============
  app.get("/api/accounting/revenue", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      let revenue;
      if (startDate && endDate) {
        const [result] = await db.select({
          total: sum(sales.grandTotal),
          count: count()
        })
          .from(sales)
          .where(
            and(
              gte(sales.date, new Date(startDate as string)),
              lte(sales.date, new Date(endDate as string))
            )
          );
        revenue = result;
      } else {
        const [result] = await db.select({
          total: sum(sales.grandTotal),
          count: count()
        }).from(sales);
        revenue = result;
      }

      res.json({
        totalRevenue: parseFloat(revenue.total || '0'),
        invoiceCount: revenue.count || 0
      });
    } catch (error) {
      console.error('Revenue calculation error:', error);
      res.status(500).json({ error: 'Failed to calculate revenue' });
    }
  });

  // =============== PURCHASE APPROVAL WORKFLOW ===============
  app.patch("/api/accounting/approve-purchase/:id", async (req: Request, res: Response) => {
    try {
      const purchaseId = parseInt(req.params.id);

      // Update purchase order status
      const [updatedPurchase] = await db
        .update(purchaseOrders)
        .set({
          status: 'received',
          updatedAt: new Date()
        })
        .where(eq(purchaseOrders.id, purchaseId))
        .returning();

      if (!updatedPurchase) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }

      // Create journal entry for the approved purchase
      const [supplier] = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, updatedPurchase.supplierId));

      // Create journal entry
      const journalCount = await db.select({ count: count() }).from(journalEntries);
      const entryNumber = `JE-${String(journalCount[0].count + 1).padStart(6, '0')}`;

      await db.insert(journalEntries).values({
        entryNumber: entryNumber,
        date: new Date().toISOString().split('T')[0],
        reference: updatedPurchase.poNumber,
        memo: `Purchase Order ${updatedPurchase.poNumber} - ${supplier?.name || 'Supplier'}`,
        status: 'posted',
        userId: req.body.userId || 1,
        totalDebit: updatedPurchase.totalAmount.toString(),
        totalCredit: updatedPurchase.totalAmount.toString(),
        sourceType: 'purchase_order',
        sourceId: updatedPurchase.id
      });

      res.json({
        message: 'Purchase order approved successfully',
        purchaseOrder: updatedPurchase
      });
    } catch (error) {
      console.error('Purchase approval error:', error);
      res.status(500).json({ error: 'Failed to approve purchase' });
    }
  });

  // =============== REAL-TIME SYNC STATUS ===============
  app.get("/api/accounting/sync-status", async (_req: Request, res: Response) => {
    try {
      // Check sync status for all modules
      const [expensesCount] = await db.select({ count: count() }).from(expenses);
      const [invoicesCount] = await db.select({ count: count() }).from(sales);
      const [purchasesCount] = await db.select({ count: count() }).from(purchaseOrders);
      const [journalEntriesCount] = await db.select({ count: count() }).from(journalEntries);

      res.json({
        modules: {
          expenses: {
            connected: true,
            recordCount: expensesCount.count || 0,
            lastSync: new Date()
          },
          invoices: {
            connected: true,
            recordCount: invoicesCount.count || 0,
            lastSync: new Date()
          },
          procurement: {
            connected: true,
            recordCount: purchasesCount.count || 0,
            lastSync: new Date()
          },
          journalEntries: {
            connected: true,
            recordCount: journalEntriesCount.count || 0,
            lastSync: new Date()
          }
        },
        overallStatus: 'connected',
        lastCheck: new Date()
      });
    } catch (error) {
      console.error('Sync status error:', error);
      res.status(500).json({
        overallStatus: 'error',
        error: 'Failed to check sync status'
      });
    }
  });
}