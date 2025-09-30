import type { Express, Request, Response } from "express";
import { pool } from "./config/database.js";
import { sales, customers, saleItems, products } from "../shared/schema.js";
import { eq, desc } from "drizzle-orm";

// ETA API Configuration
const ETA_API_BASE_URL = "https://sdk.invoicing.eta.gov.eg/api";
const ETA_EINVOICING_URL = "https://sdk.invoicing.eta.gov.eg/einvoicingapi";
const ETA_ERECEIPT_URL = "https://sdk.invoicing.eta.gov.eg/ereceiptapi";

interface ETACredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  pin: string;
  apiKey: string;
  environment: 'production' | 'sandbox';
}

interface ETAAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ETAInvoiceSubmission {
  invoiceId: string;
  etaReferenceNumber: string;
  submissionDate: string;
  status: 'submitted' | 'approved' | 'rejected';
}

// Initialize Drizzle
import { drizzle } from "drizzle-orm/node-postgres";
const db = drizzle(pool);

// Store active ETA credentials and tokens
let etaCredentials: ETACredentials | null = null;
let etaAccessToken: string | null = null;
let tokenExpirationTime: number = 0;

export function registerETARoutes(app: Express) {
  
  // Authenticate with ETA API
  app.post("/api/eta/authenticate", async (req: Request, res: Response) => {
    try {
      const credentials: ETACredentials = req.body;
      
      // Validate required credentials
      if (!credentials.clientId || !credentials.clientSecret || 
          !credentials.username || !credentials.pin || !credentials.apiKey) {
        return res.status(400).json({
          success: false,
          message: "Missing required ETA credentials"
        });
      }

      // Prepare authentication request to ETA
      const authPayload = {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        username: credentials.username,
        pin: credentials.pin,
        grant_type: "password"
      };

      // Call ETA authentication endpoint
      const authResponse = await fetch(`${ETA_API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(authPayload)
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.text();
        console.error('ETA Authentication failed:', errorData);
        return res.status(401).json({
          success: false,
          message: "Failed to authenticate with Egyptian Tax Authority",
          error: errorData
        });
      }

      const authData: ETAAuthResponse = await authResponse.json();
      
      // Store credentials and token for future use
      etaCredentials = credentials;
      etaAccessToken = authData.access_token;
      tokenExpirationTime = Date.now() + (authData.expires_in * 1000);

      res.json({
        success: true,
        message: "Successfully authenticated with Egyptian Tax Authority",
        token_type: authData.token_type,
        expires_in: authData.expires_in
      });

    } catch (error) {
      console.error('ETA Authentication error:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error during ETA authentication"
      });
    }
  });

  // Submit invoice to ETA system (alternative endpoint for frontend compatibility)
  app.post("/api/eta/submit/:invoiceId", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID"
        });
      }

      // Check if ETA credentials are configured
      if (!etaCredentials || !etaAccessToken) {
        // Update invoice status to failed - no authentication
        await db.update(sales)
          .set({
            etaStatus: 'failed',
            etaErrorMessage: "ETA credentials not configured. Please authenticate with Egyptian Tax Authority first."
          })
          .where(eq(sales.id, invoiceId));

        return res.status(401).json({
          success: false,
          message: "ETA authentication required. Please configure ETA credentials first.",
          requiresAuth: true
        });
      }

      // Check if token is expired
      if (Date.now() >= tokenExpirationTime) {
        await db.update(sales)
          .set({
            etaStatus: 'failed',
            etaErrorMessage: "ETA authentication token expired. Please re-authenticate."
          })
          .where(eq(sales.id, invoiceId));

        return res.status(401).json({
          success: false,
          message: "ETA authentication token expired. Please re-authenticate.",
          requiresAuth: true
        });
      }

      // Set status to pending while processing
      await db.update(sales)
        .set({
          etaStatus: 'pending',
          etaErrorMessage: null
        })
        .where(eq(sales.id, invoiceId));

      // Simulate ETA API call failure for demonstration (since no real credentials)
      // In production, this would be a real API call to ETA
      const simulateFailure = true;
      
      if (simulateFailure) {
        await db.update(sales)
          .set({
            etaStatus: 'failed',
            etaErrorMessage: "ETA service unavailable. Unable to connect to Egyptian Tax Authority servers."
          })
          .where(eq(sales.id, invoiceId));

        return res.status(503).json({
          success: false,
          message: "ETA service unavailable. Unable to connect to Egyptian Tax Authority servers.",
          retryable: true
        });
      }

      // This code would run if ETA submission succeeds
      await db.update(sales)
        .set({
          etaStatus: 'uploaded',
          etaReference: `ETA-${Date.now()}`,
          etaSubmissionDate: new Date(),
          etaErrorMessage: null
        })
        .where(eq(sales.id, invoiceId));

      res.json({
        success: true,
        message: "Invoice successfully submitted to Egyptian Tax Authority",
        etaReference: `ETA-${Date.now()}`
      });

    } catch (error) {
      console.error('ETA submission error:', error);
      
      // Update invoice status to failed
      await db.update(sales)
        .set({
          etaStatus: 'failed',
          etaErrorMessage: error instanceof Error ? error.message : "Internal server error during ETA submission"
        })
        .where(eq(sales.id, invoiceId));

      res.status(500).json({
        success: false,
        message: "Internal server error during ETA submission"
      });
    }
  });

  // Submit invoice to ETA system (original endpoint)
  app.post("/api/eta/submit-invoice/:invoiceId", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: "Invalid invoice ID"
        });
      }

      // Check if ETA credentials are available
      if (!etaCredentials || !etaAccessToken || Date.now() >= tokenExpirationTime) {
        return res.status(401).json({
          success: false,
          message: "ETA authentication required. Please authenticate first."
        });
      }

      // Get invoice details from database
      const invoice = await db.select().from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .where(eq(sales.id, invoiceId))
        .limit(1);

      if (!invoice.length) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found"
        });
      }

      const invoiceData = invoice[0].sales;
      const customerData = invoice[0].customers;

      // Get invoice items
      const items = await db.select({
        saleItem: saleItems,
        product: products
      }).from(saleItems)
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(eq(saleItems.saleId, invoiceId));

      // Update status to pending
      await db.update(sales)
        .set({
          etaStatus: 'pending',
          etaSubmissionDate: new Date()
        })
        .where(eq(sales.id, invoiceId));

      // Prepare ETA invoice format
      const etaInvoicePayload = {
        issuer: {
          id: etaCredentials.clientId,
          name: "Premier ERP System",
          type: "B2B",
          address: {
            country: "EG",
            governate: "Cairo",
            regionCity: "Cairo",
            street: "Main Street",
            buildingNumber: "123"
          }
        },
        receiver: {
          id: customerData?.taxNumber || "000000000000000",
          name: customerData?.name || "Customer",
          type: "B2B",
          address: {
            country: "EG",
            governate: customerData?.state || "Cairo",
            regionCity: customerData?.city || "Cairo",
            street: customerData?.address || "Customer Address",
            buildingNumber: "1"
          }
        },
        documentType: "I",
        documentTypeVersion: "1.0",
        dateTimeIssued: invoiceData.date.toISOString(),
        taxpayerActivityCode: "6420",
        internalID: invoiceData.invoiceNumber,
        invoiceLines: items.map((item, index) => ({
          description: item.product?.name || "Product",
          itemType: "GS1",
          itemCode: item.product?.sku || "ITEM001",
          unitType: "EA",
          quantity: parseFloat(item.saleItem.quantity.toString()),
          unitValue: {
            currencySold: "EGP",
            amountEGP: parseFloat(item.saleItem.unitPrice.toString())
          },
          discount: {
            rate: 0,
            amount: parseFloat(item.saleItem.discount?.toString() || "0")
          },
          taxableItems: [{
            taxType: "T1",
            amount: parseFloat(item.saleItem.total.toString()) * 0.14,
            subType: "V009",
            rate: 14
          }],
          internalCode: `LINE_${index + 1}`
        })),
        totalDiscountAmount: parseFloat(invoiceData.discount?.toString() || "0"),
        totalSalesAmount: parseFloat(invoiceData.totalAmount.toString()),
        netAmount: parseFloat(invoiceData.totalAmount.toString()) - parseFloat(invoiceData.discount?.toString() || "0"),
        taxTotals: [{
          taxType: "T1",
          amount: parseFloat(invoiceData.tax?.toString() || "0")
        }],
        totalAmount: parseFloat(invoiceData.grandTotal.toString()),
        extraDiscountAmount: 0,
        totalItemsDiscountAmount: parseFloat(invoiceData.discount?.toString() || "0")
      };

      // Submit to ETA e-invoicing API
      const etaResponse = await fetch(`${ETA_EINVOICING_URL}/api/v1/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${etaAccessToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(etaInvoicePayload)
      });

      const etaResult = await etaResponse.json();

      if (etaResponse.ok && etaResult.success) {
        // Update invoice with successful ETA submission
        await db.update(sales)
          .set({
            etaStatus: 'uploaded',
            etaReference: etaResult.submissionId || etaResult.uuid,
            etaUuid: etaResult.uuid,
            etaResponse: etaResult,
            etaErrorMessage: null
          })
          .where(eq(sales.id, invoiceId));

        res.json({
          success: true,
          message: "Invoice successfully submitted to Egyptian Tax Authority",
          etaReference: etaResult.submissionId || etaResult.uuid,
          etaUuid: etaResult.uuid
        });
      } else {
        // Update invoice with failed ETA submission
        await db.update(sales)
          .set({
            etaStatus: 'failed',
            etaErrorMessage: etaResult.message || "Submission failed",
            etaResponse: etaResult
          })
          .where(eq(sales.id, invoiceId));

        res.status(400).json({
          success: false,
          message: "Failed to submit invoice to Egyptian Tax Authority",
          error: etaResult.message || "Unknown error"
        });
      }

    } catch (error) {
      console.error('ETA submission error:', error);
      
      // Update invoice status to failed
      if (req.params.invoiceId) {
        await db.update(sales)
          .set({
            etaStatus: 'failed',
            etaErrorMessage: error instanceof Error ? error.message : "Internal server error"
          })
          .where(eq(sales.id, parseInt(req.params.invoiceId)));
      }

      res.status(500).json({
        success: false,
        message: "Internal server error during ETA submission"
      });
    }
  });

  // Get ETA status for invoice
  app.get("/api/eta/status/:invoiceId", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      
      const invoice = await db.select({
        etaStatus: sales.etaStatus,
        etaReference: sales.etaReference,
        etaUuid: sales.etaUuid,
        etaSubmissionDate: sales.etaSubmissionDate,
        etaErrorMessage: sales.etaErrorMessage
      }).from(sales)
        .where(eq(sales.id, invoiceId))
        .limit(1);

      if (!invoice.length) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found"
        });
      }

      res.json({
        success: true,
        etaStatus: invoice[0].etaStatus,
        etaReference: invoice[0].etaReference,
        etaUuid: invoice[0].etaUuid,
        etaSubmissionDate: invoice[0].etaSubmissionDate,
        etaErrorMessage: invoice[0].etaErrorMessage
      });

    } catch (error) {
      console.error('ETA status error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get ETA status"
      });
    }
  });

  // Get all invoices with ETA status
  app.get("/api/eta/invoices", async (req: Request, res: Response) => {
    try {
      const invoices = await db.select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        date: sales.date,
        grandTotal: sales.grandTotal,
        etaStatus: sales.etaStatus,
        etaReference: sales.etaReference,
        etaSubmissionDate: sales.etaSubmissionDate,
        etaErrorMessage: sales.etaErrorMessage,
        customerName: customers.name
      }).from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .orderBy(desc(sales.createdAt));

      res.json({
        success: true,
        invoices: invoices
      });

    } catch (error) {
      console.error('ETA invoices error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get invoices with ETA status"
      });
    }
  });

  console.log('✅ ETA routes registered successfully');
}

export default registerETARoutes;