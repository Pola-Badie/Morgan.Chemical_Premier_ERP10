import type { Express, Request, Response } from "express";
import { pool } from "./config/database.js";

// Standalone sales detail endpoint to fix invoice preview functionality
export function registerSalesDetailEndpoint(app: Express) {
  // Get sale by ID (for invoice details)
  app.get("/api/sales/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Get sale data using direct SQL
      const saleResult = await pool.query(`
        SELECT * FROM sales WHERE id = $1
      `, [id]);
      
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
      
      const saleItems = itemsResult.rows.map(item => ({
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
      }));
      
      // Get customer info using direct SQL
      let customer = null;
      if (sale.customer_id) {
        const customerResult = await pool.query(`
          SELECT * FROM customers WHERE id = $1
        `, [sale.customer_id]);
        customer = customerResult.rows[0] || null;
      }

      // Format response with complete data
      const response = {
        id: sale.id,
        invoiceNumber: sale.invoice_number,
        customerId: sale.customer_id,
        userId: sale.user_id,
        date: sale.date,
        dueDate: sale.due_date,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
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
}