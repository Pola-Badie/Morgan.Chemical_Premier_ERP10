import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, date, numeric, primaryKey, unique, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("staff").notNull(), // admin, sales_rep, inventory_manager, accountant, manager
  status: text("status").default("active").notNull(), // active, inactive, suspended
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User module permissions
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  moduleName: text("module_name").notNull(), // dashboard, inventory, expenses, accounting, etc.
  accessGranted: boolean("access_granted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product management
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  drugName: text("drug_name").notNull(),
  categoryId: integer("category_id").references(() => productCategories.id),
  description: text("description"),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  costPrice: numeric("cost_price").notNull(),
  sellingPrice: numeric("selling_price").notNull(),
  quantity: integer("quantity").default(0).notNull(),
  unitOfMeasure: text("unit_of_measure").default("PCS").notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  expiryDate: date("expiry_date"),
  status: text("status").default("active").notNull(), // 'active', 'expired', 'out_of_stock', 'near'
  productType: text("product_type").default("finished").notNull(), // 'raw', 'semi-raw', 'finished'
  manufacturer: text("manufacturer"),
  location: text("location"),
  shelf: text("shelf"),
  grade: text("grade").default("P").notNull(), // 'P' (Pharmaceutical), 'F' (Food), 'T' (Technical)
  imagePath: text("image_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer management
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  company: text("company"),
  position: text("position"),
  sector: text("sector"),
  taxNumber: text("tax_number").default(""), // Egyptian Tax Authority registration number
  totalPurchases: numeric("total_purchases").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sales management
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  totalAmount: numeric("total_amount").notNull(),
  subtotal: numeric("subtotal").default("0"),
  discount: numeric("discount").default("0"),
  discountAmount: numeric("discount_amount").default("0"),
  tax: numeric("tax").default("0"),
  taxRate: numeric("tax_rate").default("14"),
  taxAmount: numeric("tax_amount").default("0"),
  vatRate: numeric("vat_rate").default("14"),
  vatAmount: numeric("vat_amount").default("0"),
  grandTotal: numeric("grand_total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").default("completed").notNull(), // 'pending', 'completed', 'partial', 'failed'
  amountPaid: numeric("amount_paid").default("0"),
  paymentTerms: text("payment_terms").default("0"), // Number of days
  notes: text("notes"),
  // ETA (Egyptian Tax Authority) Integration Fields
  etaStatus: text("eta_status").default("not_sent").notNull(), // 'not_sent', 'pending', 'uploaded', 'failed'
  etaReference: text("eta_reference"), // ETA system reference number
  etaUuid: text("eta_uuid"), // ETA unique identifier
  etaSubmissionDate: timestamp("eta_submission_date"), // When submitted to ETA
  etaResponse: jsonb("eta_response"), // Full ETA API response
  etaErrorMessage: text("eta_error_message"), // Error details if failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  discount: numeric("discount").default("0"),
  total: numeric("total").notNull(),
  unitOfMeasure: text("unit_of_measure").default("Pcs"),
});

// Suppliers management
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  materials: text("materials"),
  supplierType: text("supplier_type"), // 'Local' or 'International'
  etaNumber: text("eta_number"), // Egyptian Tax Authority number
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Purchase orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  status: text("status").default("pending").notNull(), // 'pending', 'received', 'cancelled'
  totalAmount: numeric("total_amount").notNull(),
  notes: text("notes"),
  transportationType: text("transportation_type").default("standard"),
  transportationCost: numeric("transportation_cost").default("0"),
  transportationNotes: text("transportation_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  total: numeric("total").notNull(),
  receivedQuantity: integer("received_quantity").default(0),
});

// Inventory transactions
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  transactionType: text("transaction_type").notNull(), // 'purchase', 'sale', 'adjustment', 'return'
  quantity: integer("quantity").notNull(), // Positive for in, negative for out
  referenceId: integer("reference_id"), // ID from sales, purchases, etc.
  referenceType: text("reference_type"), // 'sale', 'purchase', 'adjustment'
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

// Invoices and Receipts
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: date("due_date"),
  totalAmount: numeric("total_amount").notNull(),
  status: text("status").default("unpaid").notNull(), // 'paid', 'unpaid', 'partial', 'overdue'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quotations
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: text("quotation_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  validUntil: date("valid_until").notNull(),
  totalAmount: numeric("total_amount").notNull(),
  discount: numeric("discount"),
  tax: numeric("tax"),
  subtotal: numeric("subtotal"),
  taxRate: numeric("tax_rate").default("0"),
  taxAmount: numeric("tax_amount").default("0"),
  grandTotal: numeric("grand_total").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected', 'expired', 'converted'
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").references(() => quotations.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  total: numeric("total").notNull(),
});

export const quotationPackagingItems = pgTable("quotation_packaging_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").references(() => quotations.id).notNull(),
  type: text("type").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price").notNull().default("0"),
  total: numeric("total").notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System preferences
export const systemPreferences = pgTable("system_preferences", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  category: text("category").notNull(), // 'user_management', 'inventory', 'financial', 'notifications', 'company'
  label: text("label").notNull(),
  description: text("description"),
  dataType: text("data_type").notNull(), // 'string', 'number', 'boolean', 'json', 'select'
  options: jsonb("options"), // For select types, array of options
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System role permissions
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'admin', 'sales_rep', 'inventory_manager'
  resource: text("resource").notNull(), // 'users', 'products', 'sales', etc.
  action: text("action").notNull(), // 'create', 'read', 'update', 'delete'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Login activity logs
export const loginLogs = pgTable("login_logs", {
  id: serial("id").primaryKey(), 
  userId: integer("user_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
});

// Expenses
// Expense Categories
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => expenseCategories.id),
  category: text("category"), // Account type (e.g., "Operating Expenses", "Office Supplies")
  date: date("date").notNull(), // Date field (not text)
  paymentMethod: text("payment_method").notNull(),
  costCenter: text("cost_center"), // Cost center assignment
  vendor: text("vendor"),
  receiptPath: text("receipt_path"), // File path for receipt
  notes: text("notes"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System backups
export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  status: text("status").notNull(),
  type: text("type").notNull(), // 'manual', 'daily', 'weekly', 'monthly'
});

export const backupSettings = pgTable("backup_settings", {
  id: serial("id").primaryKey(),
  dailyBackup: boolean("daily_backup").notNull().default(true),
  weeklyBackup: boolean("weekly_backup").notNull().default(true),
  monthlyBackup: boolean("monthly_backup").notNull().default(true),
  backupTime: text("backup_time").notNull().default("02:00"), // 24-hour format
  retentionDays: integer("retention_days").notNull().default(30),
});

// Reports
export const salesReports = pgTable("sales_reports", {
  id: serial("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  totalSales: numeric("total_sales").notNull(),
  totalOrders: integer("total_orders").notNull(),
  newCustomers: integer("new_customers").default(0),
  topSellingProduct: integer("top_selling_product").references(() => products.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Accounting Module

// Chart of Accounts
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // E.g., "1000", "2000", etc.
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // Asset, Liability, Equity, Income, Expense
  subtype: text("subtype"), // E.g., "Current Asset", "Fixed Asset", etc.
  description: text("description"),
  parentId: integer("parent_id").references((): any => accounts.id),
  isActive: boolean("is_active").default(true).notNull(),
  balance: numeric("balance").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Self-reference is handled in the table definition

// Journal Entries
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  entryNumber: text("entry_number").notNull().unique(),
  date: date("date").notNull(),
  reference: text("reference"), // For linking to external documents
  memo: text("memo"),
  status: text("status").default("posted").notNull(), // draft, posted, etc.
  totalDebit: numeric("total_debit").notNull(),
  totalCredit: numeric("total_credit").notNull(),
  sourceType: text("source_type"), // manual, sale, purchase, etc.
  sourceId: integer("source_id"), // ID of the source document
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Journal Entry Lines
export const journalLines = pgTable("journal_lines", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id").references(() => journalEntries.id).notNull(),
  accountId: integer("account_id").references(() => accounts.id).notNull(),
  description: text("description"),
  debit: numeric("debit").default("0"),
  credit: numeric("credit").default("0"),
  position: integer("position").notNull(), // For ordering
});

// Journal Entry Lines (alternative table name for compatibility)
export const journalEntryLines = pgTable("journal_entry_lines", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").references(() => journalEntries.id).notNull(),
  accountId: integer("account_id").references(() => accounts.id).notNull(),
  description: text("description"),
  debit: numeric("debit").default("0"),
  credit: numeric("credit").default("0"),
});

// Financial Periods
export const financialPeriods = pgTable("financial_periods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").default("open").notNull(), // open, closed, etc.
  isFiscalYear: boolean("is_fiscal_year").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Accounting Periods
export const accountingPeriods = pgTable("accounting_periods", {
  id: serial("id").primaryKey(),
  periodName: text("period_name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").default("open").notNull(), // open, closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer Payments
export const customerPayments = pgTable("customer_payments", {
  id: serial("id").primaryKey(),
  paymentNumber: text("payment_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  amount: numeric("amount").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, cheque, bankTransfer, creditCard, other
  reference: text("reference"),
  notes: text("notes"),
  status: text("status").default("completed").notNull(), // completed, pending, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment Allocations (to track which invoices were paid)
export const paymentAllocations = pgTable("payment_allocations", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => customerPayments.id).notNull(),
  invoiceId: integer("invoice_id").references(() => sales.id).notNull(),
  amount: numeric("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial Reports
export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // pnl, balance_sheet, cash_flow
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  data: jsonb("data").notNull(), // Stored report data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

// Accounts Receivable (for tracking customer balances)
export const accountsReceivable = pgTable("accounts_receivable", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  amount: numeric("amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").default("outstanding").notNull(), // outstanding, partial, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Accounts Payable (for tracking vendor bills)
export const accountsPayable = pgTable("accounts_payable", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id),
  amount: numeric("amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").default("outstanding").notNull(), // outstanding, partial, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Refunds table
export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => sales.id).notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  customerName: text("customer_name").notNull(),
  originalAmount: numeric("original_amount").notNull(),
  refundAmount: numeric("refund_amount").notNull(),
  reason: text("reason").notNull(),
  date: date("date").notNull(),
  status: text("status").default("processed").notNull(), // processed, pending, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// The parent-child relationship for accounts is already handled by the column reference
// We don't need to explicitly define the foreign key with Drizzle this way

// Insert schemas

export const insertProductCategorySchema = createInsertSchema(productCategories).pick({
  name: true,
  description: true,
});

export const insertProductSchema = createInsertSchema(products)
  .pick({
    name: true,
    drugName: true,
    categoryId: true,
    description: true,
    sku: true,
    barcode: true,
    costPrice: true,
    sellingPrice: true,
    quantity: true,
    unitOfMeasure: true,
    lowStockThreshold: true,
    expiryDate: true,
    status: true,
    productType: true,
    manufacturer: true,
    location: true,
    shelf: true,
    imagePath: true,
  })
  .extend({
    // Override the numeric fields to accept either string or number
    costPrice: z.union([z.string(), z.number()]),
    sellingPrice: z.union([z.string(), z.number()]),
    // Override expiryDate to accept string that will be converted to Date
    expiryDate: z.union([z.string(), z.date()]).optional(),
  });

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  company: true,
  position: true,
  sector: true,
  taxNumber: true,
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  invoiceNumber: true,
  customerId: true,
  userId: true,
  totalAmount: true,
  discount: true,
  tax: true,
  grandTotal: true,
  paymentMethod: true,
  paymentStatus: true,
  notes: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  discount: true,
  total: true,
  unitOfMeasure: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactPerson: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  materials: true,
  supplierType: true,
  etaNumber: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).pick({
  poNumber: true,
  supplierId: true,
  userId: true,
  expectedDeliveryDate: true,
  status: true,
  totalAmount: true,
  notes: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  invoiceNumber: true,
  saleId: true,
  customerId: true,
  dueDate: true,
  totalAmount: true,
  status: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).pick({
  quotationNumber: true,
  customerId: true,
  userId: true,
  validUntil: true,
  subtotal: true,
  taxRate: true,
  taxAmount: true,
  grandTotal: true,
  status: true,
  notes: true,
  termsAndConditions: true,
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).pick({
  quotationId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  total: true,
});

export const insertQuotationPackagingItemSchema = createInsertSchema(quotationPackagingItems).pick({
  quotationId: true,
  type: true,
  description: true,
  quantity: true,
  unitPrice: true,
  total: true,
  notes: true,
});

export const insertBackupSchema = createInsertSchema(backups).pick({
  filename: true,
  size: true,
  status: true,
  type: true,
});

export const updateBackupSettingsSchema = createInsertSchema(backupSettings).pick({
  dailyBackup: true,
  weeklyBackup: true,
  monthlyBackup: true,
  backupTime: true,
  retentionDays: true,
});

export const insertSalesReportSchema = createInsertSchema(salesReports).pick({
  reportDate: true,
  totalSales: true,
  totalOrders: true,
  newCustomers: true,
  topSellingProduct: true,
});

export const insertSystemPreferenceSchema = createInsertSchema(systemPreferences).pick({
  key: true,
  value: true,
  category: true,
  label: true,
  description: true,
  dataType: true,
  options: true,
});

export const updateSystemPreferenceSchema = z.object({
  value: z.any(),
  updatedAt: z.date().optional(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).pick({
  role: true,
  resource: true,
  action: true,
});


export const insertLoginLogSchema = createInsertSchema(loginLogs).pick({
  userId: true,
  ipAddress: true,
  userAgent: true,
  success: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  status: true,
  avatar: true,
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).pick({
  userId: true,
  moduleName: true,
  accessGranted: true,
});

// Types
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ProductCategory = typeof productCategories.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;

export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;

export type InsertQuotationPackagingItem = z.infer<typeof insertQuotationPackagingItemSchema>;
export type QuotationPackagingItem = typeof quotationPackagingItems.$inferSelect;

export type InsertBackup = z.infer<typeof insertBackupSchema>;
export type Backup = typeof backups.$inferSelect;

export type UpdateBackupSettings = z.infer<typeof updateBackupSettingsSchema>;
export type BackupSettings = typeof backupSettings.$inferSelect;

export type InsertSalesReport = z.infer<typeof insertSalesReportSchema>;
export type SalesReport = typeof salesReports.$inferSelect;

// Create an update product schema
export const updateProductSchema = z.object({
  name: z.string().optional(),
  drugName: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  costPrice: z.union([z.string(), z.number()]).optional(),
  sellingPrice: z.union([z.string(), z.number()]).optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  unitOfMeasure: z.string().optional(),
  grade: z.string().optional(),
  lowStockThreshold: z.number().optional(),
  expiryDate: z.date().optional(),
  manufacturer: z.string().optional(),
  location: z.string().optional(),
  shelf: z.string().optional(),
  status: z.string().optional(),
  productType: z.string().optional(),
  imagePath: z.string().optional(),
  updatedAt: z.date().optional()
});

export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

export type InsertSystemPreference = z.infer<typeof insertSystemPreferenceSchema>;
export type SystemPreference = typeof systemPreferences.$inferSelect;
export type UpdateSystemPreference = z.infer<typeof updateSystemPreferenceSchema>;

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;


export type InsertLoginLog = z.infer<typeof insertLoginLogSchema>;
export type LoginLog = typeof loginLogs.$inferSelect;

// Accounting module schemas and types
export const insertAccountSchema = createInsertSchema(accounts).pick({
  code: true,
  name: true,
  type: true,
  subtype: true,
  description: true,
  parentId: true,
  isActive: true,
});

export const insertAccountingPeriodSchema = createInsertSchema(accountingPeriods).pick({
  periodName: true,
  startDate: true,
  endDate: true,
  status: true,
});

export const insertCustomerPaymentSchema = createInsertSchema(customerPayments).pick({
  paymentNumber: true,
  customerId: true,
  amount: true,
  paymentDate: true,
  paymentMethod: true,
  reference: true,
  notes: true,
  status: true,
});

export const insertPaymentAllocationSchema = createInsertSchema(paymentAllocations).pick({
  paymentId: true,
  invoiceId: true,
  amount: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).pick({
  entryNumber: true,
  date: true,
  reference: true,
  memo: true,
  status: true,
  totalDebit: true,
  totalCredit: true,
  sourceType: true,
  sourceId: true,
  userId: true,
});

export const insertJournalLineSchema = createInsertSchema(journalLines).pick({
  journalId: true,
  accountId: true,
  description: true,
  debit: true,
  credit: true,
  position: true,
});

export const insertFinancialPeriodSchema = createInsertSchema(financialPeriods).pick({
  name: true,
  startDate: true,
  endDate: true,
  status: true,
  isFiscalYear: true,
});

export const insertFinancialReportSchema = createInsertSchema(financialReports).pick({
  type: true,
  name: true,
  startDate: true,
  endDate: true,
  data: true,
  userId: true,
});

export const insertAccountsReceivableSchema = createInsertSchema(accountsReceivable).pick({
  customerId: true,
  invoiceId: true,
  amount: true,
  dueDate: true,
  status: true,
});

export const insertAccountsPayableSchema = createInsertSchema(accountsPayable).pick({
  supplierId: true,
  purchaseOrderId: true,
  amount: true,
  dueDate: true,
  status: true,
});

export const insertRefundSchema = createInsertSchema(refunds).pick({
  invoiceId: true,
  invoiceNumber: true,
  customerId: true,
  customerName: true,
  originalAmount: true,
  refundAmount: true,
  reason: true,
  date: true,
  status: true,
});

// Accounting module types
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

export type InsertJournalLine = z.infer<typeof insertJournalLineSchema>;
export type JournalLine = typeof journalLines.$inferSelect;

export type InsertFinancialPeriod = z.infer<typeof insertFinancialPeriodSchema>;
export type FinancialPeriod = typeof financialPeriods.$inferSelect;

export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;
export type FinancialReport = typeof financialReports.$inferSelect;

export type InsertAccountsReceivable = z.infer<typeof insertAccountsReceivableSchema>;
export type AccountsReceivable = typeof accountsReceivable.$inferSelect;

export type InsertAccountsPayable = z.infer<typeof insertAccountsPayableSchema>;
export type AccountsPayable = typeof accountsPayable.$inferSelect;

export type InsertAccountingPeriod = z.infer<typeof insertAccountingPeriodSchema>;
export type AccountingPeriod = typeof accountingPeriods.$inferSelect;

export type InsertCustomerPayment = z.infer<typeof insertCustomerPaymentSchema>;
export type CustomerPayment = typeof customerPayments.$inferSelect;

export type InsertPaymentAllocation = z.infer<typeof insertPaymentAllocationSchema>;
export type PaymentAllocation = typeof paymentAllocations.$inferSelect;

export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type Refund = typeof refunds.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

// Order Management
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  orderType: text("order_type").notNull(), // 'production', 'refining'
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  description: text("description"),
  totalMaterialCost: numeric("total_material_cost").default("0").notNull(),
  totalAdditionalFees: numeric("total_additional_fees").default("0").notNull(),
  totalCost: numeric("total_cost").default("0").notNull(),
  profitMarginPercentage: numeric("profit_margin_percentage").default("20").notNull(), // Configurable profit margin percentage
  status: text("status").default("pending").notNull(), // 'pending', 'in_progress', 'completed', 'cancelled'
  targetProductId: integer("target_product_id").references(() => products.id), // For refining orders
  expectedOutputQuantity: numeric("expected_output_quantity"), // For refining orders
  refiningSteps: text("refining_steps"), // Optional steps for refining
  rawMaterials: jsonb("raw_materials"), // Store raw materials as JSON
  packagingMaterials: jsonb("packaging_materials"), // Store packaging materials as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: numeric("quantity").notNull(),
  unitCost: numeric("unit_cost").notNull(),
  subtotal: numeric("subtotal").notNull(),
});

export const orderFees = pgTable("order_fees", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  feeLabel: text("fee_label").notNull(),
  amount: numeric("amount").notNull(),
});

// Order Management schemas
export const insertOrderSchema = createInsertSchema(orders).pick({
  orderNumber: true,
  orderType: true,
  customerId: true,
  userId: true,
  description: true,
  totalMaterialCost: true,
  totalAdditionalFees: true,
  totalCost: true,
  profitMarginPercentage: true,
  status: true,
  targetProductId: true,
  expectedOutputQuantity: true,
  refiningSteps: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  unitCost: true,
  subtotal: true,
});

export const insertOrderFeeSchema = createInsertSchema(orderFees).pick({
  orderId: true,
  feeLabel: true,
  amount: true,
});

// Order Management types
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertOrderFee = z.infer<typeof insertOrderFeeSchema>;
export type OrderFee = typeof orderFees.$inferSelect;

// Pharmaceutical-specific tables

// Batch Management for pharmaceutical tracking
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  batchNumber: text("batch_number").notNull().unique(),
  productId: integer("product_id").references(() => products.id).notNull(),
  manufactureDate: date("manufacture_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  quantity: numeric("quantity").notNull(),
  remainingQuantity: numeric("remaining_quantity").notNull(),
  lotNumber: text("lot_number"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  storageLocation: text("storage_location"),
  status: text("status").default("active").notNull(), // active, expired, recalled, quarantine
  qualityTestResults: jsonb("quality_test_results"), // Store test results as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product Formulations (for chemical compositions)
export const productFormulations = pgTable("product_formulations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  ingredientId: integer("ingredient_id").references(() => products.id).notNull(), // Raw material reference
  concentration: numeric("concentration"), // Percentage or amount
  unit: text("unit").notNull(), // mg, ml, g, kg, etc.
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Safety and Regulatory Information
export const productSafety = pgTable("product_safety", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  hazardSymbols: text("hazard_symbols").array(), // Array of hazard symbol codes
  safetyDataSheet: text("safety_data_sheet"), // File path to SDS
  storageConditions: text("storage_conditions"),
  handlingInstructions: text("handling_instructions"),
  emergencyProcedures: text("emergency_procedures"),
  regulatoryNumbers: jsonb("regulatory_numbers"), // FDA, EMA numbers etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quality Control Tests
export const qualityTests = pgTable("quality_tests", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => batches.id).notNull(),
  testType: text("test_type").notNull(), // purity, potency, dissolution, etc.
  testDate: timestamp("test_date").defaultNow().notNull(),
  testResults: jsonb("test_results"), // Store complex test data
  passedTest: boolean("passed_test").notNull(),
  testedBy: integer("tested_by").references(() => users.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Production Orders (manufacturing)
export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  productId: integer("product_id").references(() => products.id).notNull(),
  plannedQuantity: numeric("planned_quantity").notNull(),
  actualQuantity: numeric("actual_quantity").default("0"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").default("planned").notNull(), // planned, in_progress, completed, cancelled
  priority: text("priority").default("normal").notNull(), // low, normal, high, urgent
  supervisorId: integer("supervisor_id").references(() => users.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Production Order Materials (BOM - Bill of Materials)
export const productionMaterials = pgTable("production_materials", {
  id: serial("id").primaryKey(),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id).notNull(),
  materialId: integer("material_id").references(() => products.id).notNull(),
  plannedQuantity: numeric("planned_quantity").notNull(),
  actualQuantity: numeric("actual_quantity").default("0"),
  batchId: integer("batch_id").references(() => batches.id), // Track which batch was used
  unitCost: numeric("unit_cost").notNull(),
});

// GS1 Barcodes and Labels
export const productLabels = pgTable("product_labels", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  batchId: integer("batch_id").references(() => batches.id),
  gs1Code: text("gs1_code").notNull().unique(),
  qrCodeData: text("qr_code_data"), // JSON string with product info
  labelTemplate: text("label_template").notNull(), // Template name
  printedCount: integer("printed_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Regulatory Compliance
export const regulatorySubmissions = pgTable("regulatory_submissions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  submissionType: text("submission_type").notNull(), // ETA, FDA, EMA, etc.
  submissionDate: timestamp("submission_date").notNull(),
  approvalDate: timestamp("approval_date"),
  status: text("status").default("submitted").notNull(), // submitted, under_review, approved, rejected
  referenceNumber: text("reference_number"),
  documents: text("documents").array(), // File paths to documents
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inventory Adjustments
export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  batchId: integer("batch_id").references(() => batches.id),
  adjustmentType: text("adjustment_type").notNull(), // increase, decrease, recount
  previousQuantity: numeric("previous_quantity").notNull(),
  adjustedQuantity: numeric("adjusted_quantity").notNull(),
  difference: numeric("difference").notNull(),
  reason: text("reason").notNull(),
  approvedBy: integer("approved_by").references(() => users.id).notNull(),
  adjustedBy: integer("adjusted_by").references(() => users.id).notNull(),
  adjustmentDate: timestamp("adjustment_date").defaultNow().notNull(),
  notes: text("notes"),
});

// Warehouse Management
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  managerId: integer("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const warehouseLocations = pgTable("warehouse_locations", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id).notNull(),
  aisle: text("aisle"),
  rack: text("rack"),
  shelf: text("shelf"),
  bin: text("bin"),
  locationCode: text("location_code").notNull().unique(),
  maxCapacity: numeric("max_capacity"),
  currentCapacity: numeric("current_capacity").default("0"),
  temperatureControlled: boolean("temperature_controlled").default(false),
  isActive: boolean("is_active").default(true).notNull(),
});

// Warehouse Inventory - tracks product quantities per warehouse
export const warehouseInventory = pgTable("warehouse_inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id).notNull(),
  quantity: integer("quantity").default(0).notNull(),
  reservedQuantity: integer("reserved_quantity").default(0).notNull(), // For pending orders
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id).notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate product-warehouse combinations
  productWarehouse: unique().on(table.productId, table.warehouseId),
}));

// Stock Movements
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  batchId: integer("batch_id").references(() => batches.id),
  fromLocationId: integer("from_location_id").references(() => warehouseLocations.id),
  toLocationId: integer("to_location_id").references(() => warehouseLocations.id),
  movementType: text("movement_type").notNull(), // receive, ship, transfer, adjust
  quantity: numeric("quantity").notNull(),
  referenceType: text("reference_type"), // sale, purchase, production, adjustment
  referenceId: integer("reference_id"),
  movedBy: integer("moved_by").references(() => users.id).notNull(),
  movementDate: timestamp("movement_date").defaultNow().notNull(),
  notes: text("notes"),
});

// Advanced Financial Tables

// Tax Management
export const taxRates = pgTable("tax_rates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rate: numeric("rate").notNull(), // Percentage
  type: text("type").notNull(), // VAT, sales_tax, excise, etc.
  jurisdiction: text("jurisdiction"), // Country, state, etc.
  isActive: boolean("is_active").default(true).notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Currency Management
export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // USD, EUR, EGP, etc.
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  exchangeRate: numeric("exchange_rate").notNull(), // Against base currency
  isBaseCurrency: boolean("is_base_currency").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Bank Accounts
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name").notNull(),
  routingNumber: text("routing_number"),
  iban: text("iban"),
  swiftCode: text("swift_code"),
  currencyId: integer("currency_id").references(() => currencies.id).notNull(),
  accountType: text("account_type").notNull(), // checking, savings, credit
  currentBalance: numeric("current_balance").default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Budget Management
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  budgetYear: integer("budget_year").notNull(),
  totalBudget: numeric("total_budget").notNull(),
  spentAmount: numeric("spent_amount").default("0"),
  remainingAmount: numeric("remaining_amount").notNull(),
  status: text("status").default("active").notNull(), // active, closed, draft
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").references(() => budgets.id).notNull(),
  categoryName: text("category_name").notNull(),
  allocatedAmount: numeric("allocated_amount").notNull(),
  spentAmount: numeric("spent_amount").default("0"),
  remainingAmount: numeric("remaining_amount").notNull(),
});

// Asset Management
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetNumber: text("asset_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // equipment, vehicle, building, etc.
  purchaseDate: date("purchase_date").notNull(),
  purchasePrice: numeric("purchase_price").notNull(),
  currentValue: numeric("current_value").notNull(),
  depreciationMethod: text("depreciation_method"), // straight_line, declining_balance
  usefulLife: integer("useful_life"), // Years
  location: text("location"),
  custodian: integer("custodian").references(() => users.id),
  status: text("status").default("active").notNull(), // active, disposed, maintenance
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Maintenance Records
export const maintenanceRecords = pgTable("maintenance_records", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").references(() => assets.id).notNull(),
  maintenanceType: text("maintenance_type").notNull(), // preventive, corrective, emergency
  description: text("description").notNull(),
  cost: numeric("cost").notNull(),
  performedBy: text("performed_by"), // Internal or external
  performedDate: date("performed_date").notNull(),
  nextMaintenanceDate: date("next_maintenance_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employee Management Extension
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  managerId: integer("manager_id").references(() => users.id),
  budgetId: integer("budget_id").references(() => budgets.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeProfiles = pgTable("employee_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  employeeId: text("employee_id").notNull().unique(),
  departmentId: integer("department_id").references(() => departments.id),
  position: text("position"),
  hireDate: date("hire_date").notNull(),
  salary: numeric("salary"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  address: text("address"),
  birthDate: date("birth_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document Management
export const documentTypes = pgTable("document_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  requiredFields: jsonb("required_fields"), // JSON array of required field names
  isActive: boolean("is_active").default(true).notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  documentNumber: text("document_number").notNull().unique(),
  typeId: integer("type_id").references(() => documentTypes.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  entityType: text("entity_type"), // product, customer, supplier, etc.
  entityId: integer("entity_id"), // ID of the related entity
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true).notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit Trail
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),
  recordId: integer("record_id").notNull(),
  action: text("action").notNull(), // INSERT, UPDATE, DELETE
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  changedBy: integer("changed_by").references(() => users.id).notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Enhanced authorization system - Feature-level permissions
export const featurePermissions = pgTable("feature_permissions", {
  id: serial("id").primaryKey(),
  scope: text("scope").notNull(), // 'user', 'role', 'global'
  targetId: integer("target_id").references(() => users.id), // FK to users when scope='user', null for role/global
  targetRole: text("target_role"), // Role name when scope='role', null otherwise
  module: text("module").notNull(), // 'inventory', 'orders', 'accounting', etc.
  feature: text("feature").notNull(), // 'view_prices', 'edit_costs', 'export_data', etc.
  effect: text("effect").notNull().default("allow"), // 'allow', 'deny'
  priority: integer("priority").notNull().default(100), // Lower number = higher priority
  conditions: jsonb("conditions"), // Structured conditions { timeRange?: {start: string, end: string}, customerTier?: string[] }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Basic unique constraint for now - we'll add advanced constraints later
  uniquePermission: unique("unique_feature_permission").on(table.scope, table.targetId, table.targetRole, table.module, table.feature),
  // Basic indexes for performance
  moduleFeatureIdx: index("feature_module_idx").on(table.module, table.feature),
  targetIdx: index("feature_target_idx").on(table.targetId),
  roleIdx: index("feature_role_idx").on(table.targetRole),
  priorityIdx: index("feature_priority_idx").on(table.priority),
}));

// Field-level visibility and edit permissions
export const fieldPermissions = pgTable("field_permissions", {
  id: serial("id").primaryKey(),
  scope: text("scope").notNull(), // 'user', 'role', 'global'
  targetId: integer("target_id").references(() => users.id), // FK to users when scope='user', null for role/global
  targetRole: text("target_role"), // Role name when scope='role', null otherwise
  module: text("module").notNull(), // 'inventory', 'orders', 'customers', etc.
  entityType: text("entity_type").notNull(), // 'product', 'order', 'customer', etc.
  fieldName: text("field_name").notNull(), // 'costPrice', 'sellingPrice', 'totalCost', etc.
  canView: boolean("can_view").notNull().default(true),
  canEdit: boolean("can_edit").notNull().default(false),
  isRequired: boolean("is_required").notNull().default(false),
  effect: text("effect").notNull().default("allow"), // 'allow', 'deny'
  priority: integer("priority").notNull().default(100), // Lower number = higher priority
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Basic unique constraint for now - we'll add advanced constraints later
  uniqueFieldPermission: unique("unique_field_permission").on(table.scope, table.targetId, table.targetRole, table.module, table.entityType, table.fieldName),
  // Basic indexes for performance
  moduleEntityFieldIdx: index("field_module_entity_idx").on(table.module, table.entityType, table.fieldName),
  targetIdx: index("field_target_idx").on(table.targetId),
  roleIdx: index("field_role_idx").on(table.targetRole),
  priorityIdx: index("field_priority_idx").on(table.priority),
}));

// Authorization configurations - Store reusable authorization rules
export const authorizationConfigs = pgTable("authorization_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'inventory_basic_user', 'financial_readonly', etc.
  description: text("description"),
  type: text("type").notNull(), // 'feature', 'field', 'module'
  rules: jsonb("rules").notNull(), // Complete authorization rule set with proper schema
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure unique names for configs
  uniqueName: unique().on(table.name),
  // Index for performance
  typeIdx: index().on(table.type),
  activeIdx: index().on(table.isActive),
}));

// Authorization config assignments - Link configs to users/roles
export const authorizationConfigAssignments = pgTable("authorization_config_assignments", {
  id: serial("id").primaryKey(),
  scope: text("scope").notNull(), // 'user', 'role'
  targetId: integer("target_id").references(() => users.id), // FK to users when scope='user', null for role
  targetRole: text("target_role"), // Role name when scope='role', null otherwise  
  configId: integer("config_id").references(() => authorizationConfigs.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint ensuring no duplicate assignments
  uniqueAssignment: unique().on(table.scope, table.targetId, table.targetRole, table.configId),
  // Indexes for performance
  targetIdx: index().on(table.targetId),
  roleIdx: index().on(table.targetRole),
  configIdx: index().on(table.configId),
}));

// Authorization access logs - Track all authorization decisions
export const authorizationLogs = pgTable("authorization_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  module: text("module").notNull(),
  feature: text("feature"),
  fieldName: text("field_name"),
  action: text("action").notNull(), // 'view', 'edit', 'create', 'delete'
  granted: boolean("granted").notNull(),
  reason: text("reason").notNull(), // Reason for grant/deny
  matchedRuleId: integer("matched_rule_id"), // ID of the permission rule that matched
  configId: integer("config_id").references(() => authorizationConfigs.id), // Config that provided the rule
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  responseTime: integer("response_time"), // Time taken to check permission in ms
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance and queries
  userModuleIdx: index().on(table.userId, table.module),
  moduleFeatureIdx: index().on(table.module, table.feature),
  fieldIdx: index().on(table.module, table.fieldName),
  actionIdx: index().on(table.action),
  createdAtIdx: index().on(table.createdAt),
  grantedIdx: index().on(table.granted),
}));

// Notifications System
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(), // email, sms, push, in_app
  category: text("category").notNull(), // stock_alert, payment_due, etc.
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => notificationTemplates.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, warning, error, success
  category: text("category").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  data: jsonb("data"), // Additional data for the notification
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

// Reports and Analytics
export const reportDefinitions = pgTable("report_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // financial, inventory, sales, etc.
  sqlQuery: text("sql_query").notNull(),
  parameters: jsonb("parameters"), // JSON array of parameter definitions
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reportInstances = pgTable("report_instances", {
  id: serial("id").primaryKey(),
  definitionId: integer("definition_id").references(() => reportDefinitions.id).notNull(),
  name: text("name").notNull(),
  parameters: jsonb("parameters"), // Actual parameter values used
  generatedData: jsonb("generated_data"), // The report results
  generatedBy: integer("generated_by").references(() => users.id).notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// Integration with External Systems
export const integrationConfigs = pgTable("integration_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // api, ftp, email, etc.
  endpoint: text("endpoint"),
  credentials: jsonb("credentials"), // Encrypted credentials
  settings: jsonb("settings"), // Configuration settings
  isActive: boolean("is_active").default(true).notNull(),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => integrationConfigs.id).notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  status: text("status").notNull(), // success, failed, in_progress
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  details: jsonb("details"),
});

// Drizzle Relations for better query optimization

export const usersRelations = relations(users, ({ many, one }) => ({
  permissions: many(userPermissions),
  sales: many(sales),
  quotations: many(quotations),
  orders: many(orders),
  productionOrders: many(productionOrders),
  employeeProfile: one(employeeProfiles, {
    fields: [users.id],
    references: [employeeProfiles.userId],
  }),
  department: one(departments, {
    fields: [users.id],
    references: [departments.managerId],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  batches: many(batches),
  formulations: many(productFormulations),
  safety: one(productSafety),
  labels: many(productLabels),
  saleItems: many(saleItems),
  quotationItems: many(quotationItems),
  orderItems: many(orderItems),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  product: one(products, {
    fields: [batches.productId],
    references: [products.id],
  }),
  supplier: one(suppliers, {
    fields: [batches.supplierId],
    references: [suppliers.id],
  }),
  qualityTests: many(qualityTests),
  labels: many(productLabels),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
  quotations: many(quotations),
  orders: many(orders),
  payments: many(customerPayments),
  receivables: many(accountsReceivable),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  batches: many(batches),
  payables: many(accountsPayable),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  items: many(saleItems),
  invoice: one(invoices),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotations.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [quotations.userId],
    references: [users.id],
  }),
  items: many(quotationItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  targetProduct: one(products, {
    fields: [orders.targetProductId],
    references: [products.id],
  }),
  items: many(orderItems),
  fees: many(orderFees),
}));

// Additional Insert Schemas for new tables
export const insertBatchSchema = createInsertSchema(batches).pick({
  batchNumber: true,
  productId: true,
  manufactureDate: true,
  expiryDate: true,
  quantity: true,
  remainingQuantity: true,
  lotNumber: true,
  supplierId: true,
  storageLocation: true,
  status: true,
  qualityTestResults: true,
});

export const insertProductFormulationSchema = createInsertSchema(productFormulations).pick({
  productId: true,
  ingredientId: true,
  concentration: true,
  unit: true,
  isActive: true,
});

export const insertProductSafetySchema = createInsertSchema(productSafety).pick({
  productId: true,
  hazardSymbols: true,
  safetyDataSheet: true,
  storageConditions: true,
  handlingInstructions: true,
  emergencyProcedures: true,
  regulatoryNumbers: true,
});

export const insertQualityTestSchema = createInsertSchema(qualityTests).pick({
  batchId: true,
  testType: true,
  testDate: true,
  testResults: true,
  passedTest: true,
  testedBy: true,
  notes: true,
});

export const insertProductionOrderSchema = createInsertSchema(productionOrders).pick({
  orderNumber: true,
  productId: true,
  plannedQuantity: true,
  actualQuantity: true,
  startDate: true,
  endDate: true,
  status: true,
  priority: true,
  supervisorId: true,
  notes: true,
});

export const insertProductLabelSchema = createInsertSchema(productLabels).pick({
  productId: true,
  batchId: true,
  gs1Code: true,
  qrCodeData: true,
  labelTemplate: true,
  printedCount: true,
});

export const insertRegulatorySubmissionSchema = createInsertSchema(regulatorySubmissions).pick({
  productId: true,
  submissionType: true,
  submissionDate: true,
  approvalDate: true,
  status: true,
  referenceNumber: true,
  documents: true,
  notes: true,
});

export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustments).pick({
  productId: true,
  batchId: true,
  adjustmentType: true,
  previousQuantity: true,
  adjustedQuantity: true,
  difference: true,
  reason: true,
  approvedBy: true,
  adjustedBy: true,
  adjustmentDate: true,
  notes: true,
});

export const insertWarehouseSchema = createInsertSchema(warehouses).pick({
  name: true,
  code: true,
  address: true,
  managerId: true,
  isActive: true,
});

export const insertWarehouseLocationSchema = createInsertSchema(warehouseLocations).pick({
  warehouseId: true,
  aisle: true,
  rack: true,
  shelf: true,
  bin: true,
  locationCode: true,
  maxCapacity: true,
  currentCapacity: true,
  temperatureControlled: true,
  isActive: true,
});

export const insertWarehouseInventorySchema = createInsertSchema(warehouseInventory).pick({
  productId: true,
  warehouseId: true,
  quantity: true,
  reservedQuantity: true,
  updatedBy: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).pick({
  productId: true,
  batchId: true,
  fromLocationId: true,
  toLocationId: true,
  movementType: true,
  quantity: true,
  referenceType: true,
  referenceId: true,
  movedBy: true,
  movementDate: true,
  notes: true,
});

export const insertTaxRateSchema = createInsertSchema(taxRates).pick({
  name: true,
  rate: true,
  type: true,
  jurisdiction: true,
  isActive: true,
  effectiveFrom: true,
  effectiveTo: true,
});

export const insertCurrencySchema = createInsertSchema(currencies).pick({
  code: true,
  name: true,
  symbol: true,
  exchangeRate: true,
  isBaseCurrency: true,
  isActive: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).pick({
  accountName: true,
  accountNumber: true,
  bankName: true,
  routingNumber: true,
  iban: true,
  swiftCode: true,
  currencyId: true,
  accountType: true,
  currentBalance: true,
  isActive: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).pick({
  name: true,
  description: true,
  budgetYear: true,
  totalBudget: true,
  spentAmount: true,
  remainingAmount: true,
  status: true,
  createdBy: true,
});

export const insertAssetSchema = createInsertSchema(assets).pick({
  assetNumber: true,
  name: true,
  description: true,
  category: true,
  purchaseDate: true,
  purchasePrice: true,
  currentValue: true,
  depreciationMethod: true,
  usefulLife: true,
  location: true,
  custodian: true,
  status: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
  managerId: true,
  budgetId: true,
  isActive: true,
});

export const insertEmployeeProfileSchema = createInsertSchema(employeeProfiles).pick({
  userId: true,
  employeeId: true,
  departmentId: true,
  position: true,
  hireDate: true,
  salary: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  address: true,
  birthDate: true,
  isActive: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  documentNumber: true,
  typeId: true,
  title: true,
  description: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  entityType: true,
  entityId: true,
  version: true,
  isActive: true,
  uploadedBy: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  templateId: true,
  title: true,
  message: true,
  type: true,
  category: true,
  isRead: true,
  data: true,
});

// Additional Type Exports
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;

export type InsertProductFormulation = z.infer<typeof insertProductFormulationSchema>;
export type ProductFormulation = typeof productFormulations.$inferSelect;

export type InsertProductSafety = z.infer<typeof insertProductSafetySchema>;
export type ProductSafety = typeof productSafety.$inferSelect;

export type InsertQualityTest = z.infer<typeof insertQualityTestSchema>;
export type QualityTest = typeof qualityTests.$inferSelect;

export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type ProductionOrder = typeof productionOrders.$inferSelect;

export type InsertProductLabel = z.infer<typeof insertProductLabelSchema>;
export type ProductLabel = typeof productLabels.$inferSelect;

export type InsertRegulatorySubmission = z.infer<typeof insertRegulatorySubmissionSchema>;
export type RegulatorySubmission = typeof regulatorySubmissions.$inferSelect;

export type InsertInventoryAdjustment = z.infer<typeof insertInventoryAdjustmentSchema>;
export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;

export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;

export type InsertWarehouseLocation = z.infer<typeof insertWarehouseLocationSchema>;
export type WarehouseLocation = typeof warehouseLocations.$inferSelect;

export type InsertWarehouseInventory = z.infer<typeof insertWarehouseInventorySchema>;
export type WarehouseInventory = typeof warehouseInventory.$inferSelect;

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

export type InsertTaxRate = z.infer<typeof insertTaxRateSchema>;
export type TaxRate = typeof taxRates.$inferSelect;

export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type Currency = typeof currencies.$inferSelect;

export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertEmployeeProfile = z.infer<typeof insertEmployeeProfileSchema>;
export type EmployeeProfile = typeof employeeProfiles.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type DocumentType = typeof documentTypes.$inferSelect;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type ReportDefinition = typeof reportDefinitions.$inferSelect;
export type ReportInstance = typeof reportInstances.$inferSelect;
export type IntegrationConfig = typeof integrationConfigs.$inferSelect;
export type SyncLog = typeof syncLogs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ProductionMaterial = typeof productionMaterials.$inferSelect;

// Expense schema and types
export const insertExpenseSchema = createInsertSchema(expenses).pick({
  description: true,
  amount: true,
  category: true,
  date: true,
  paymentMethod: true,
  status: true,
  costCenter: true,
  notes: true,
  userId: true,
  receiptPath: true,
}).extend({
  // Override amount to accept either string or number
  amount: z.union([z.string(), z.number()]),
  // Override date to accept string that will be converted to Date
  date: z.union([z.string(), z.date()]).optional(),
});

export const updateExpenseStatusSchema = z.object({
  status: z.string(),
  updatedAt: z.date().optional(),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type UpdateExpenseStatus = z.infer<typeof updateExpenseStatusSchema>;

// Enhanced authorization schema validations and types
export const insertFeaturePermissionSchema = z.discriminatedUnion("scope", [
  // User scope - requires targetId, forbids targetRole
  z.object({
    scope: z.literal("user"),
    targetId: z.number().int().positive(),
    targetRole: z.undefined().optional(),
    module: z.string().min(1),
    feature: z.string().min(1),
    effect: z.enum(["allow", "deny"]).default("allow"),
    priority: z.number().int().min(0).max(10000).default(100),
    conditions: z.object({
      timeRange: z.object({
        start: z.string(),
        end: z.string()
      }).optional(),
      customerTier: z.array(z.string()).optional(),
      location: z.array(z.string()).optional(),
    }).optional(),
  }),
  // Role scope - requires targetRole, forbids targetId
  z.object({
    scope: z.literal("role"),
    targetId: z.undefined().optional(),
    targetRole: z.string().min(1),
    module: z.string().min(1),
    feature: z.string().min(1),
    effect: z.enum(["allow", "deny"]).default("allow"),
    priority: z.number().int().min(0).max(10000).default(100),
    conditions: z.object({
      timeRange: z.object({
        start: z.string(),
        end: z.string()
      }).optional(),
      customerTier: z.array(z.string()).optional(),
      location: z.array(z.string()).optional(),
    }).optional(),
  }),
  // Global scope - forbids both targetId and targetRole
  z.object({
    scope: z.literal("global"),
    targetId: z.undefined().optional(),
    targetRole: z.undefined().optional(),
    module: z.string().min(1),
    feature: z.string().min(1),
    effect: z.enum(["allow", "deny"]).default("allow"),
    priority: z.number().int().min(0).max(10000).default(100),
    conditions: z.object({
      timeRange: z.object({
        start: z.string(),
        end: z.string()
      }).optional(),
      customerTier: z.array(z.string()).optional(),
      location: z.array(z.string()).optional(),
    }).optional(),
  }),
]);

export const insertFieldPermissionSchema = z.discriminatedUnion("scope", [
  // User scope - requires targetId, forbids targetRole
  z.object({
    scope: z.literal("user"),
    targetId: z.number().int().positive(),
    targetRole: z.undefined().optional(),
    module: z.string().min(1),
    entityType: z.string().min(1),
    fieldName: z.string().min(1),
    canView: z.boolean().default(true),
    canEdit: z.boolean().default(false),
    isRequired: z.boolean().default(false),
    effect: z.enum(["allow", "deny"]).default("allow"),
    priority: z.number().int().min(0).max(10000).default(100),
  }),
  // Role scope - requires targetRole, forbids targetId
  z.object({
    scope: z.literal("role"),
    targetId: z.undefined().optional(),
    targetRole: z.string().min(1),
    module: z.string().min(1),
    entityType: z.string().min(1),
    fieldName: z.string().min(1),
    canView: z.boolean().default(true),
    canEdit: z.boolean().default(false),
    isRequired: z.boolean().default(false),
    effect: z.enum(["allow", "deny"]).default("allow"),
    priority: z.number().int().min(0).max(10000).default(100),
  }),
  // Global scope - forbids both targetId and targetRole
  z.object({
    scope: z.literal("global"),
    targetId: z.undefined().optional(),
    targetRole: z.undefined().optional(),
    module: z.string().min(1),
    entityType: z.string().min(1),
    fieldName: z.string().min(1),
    canView: z.boolean().default(true),
    canEdit: z.boolean().default(false),
    isRequired: z.boolean().default(false),
    effect: z.enum(["allow", "deny"]).default("allow"),
    priority: z.number().int().min(0).max(10000).default(100),
  }),
]);

export const insertAuthorizationConfigSchema = createInsertSchema(authorizationConfigs).pick({
  name: true,
  description: true,
  type: true,
  rules: true,
  isActive: true,
  createdBy: true,
}).extend({
  rules: z.object({
    features: z.array(z.object({
      module: z.string(),
      feature: z.string(),
      effect: z.enum(["allow", "deny"]),
      priority: z.number().optional(),
    })).optional(),
    fields: z.array(z.object({
      module: z.string(),
      entityType: z.string(),
      fieldName: z.string(),
      canView: z.boolean(),
      canEdit: z.boolean(),
      isRequired: z.boolean().optional(),
    })).optional(),
  }),
});

export const insertAuthorizationConfigAssignmentSchema = createInsertSchema(authorizationConfigAssignments).pick({
  scope: true,
  targetId: true,
  targetRole: true,
  configId: true,
  isActive: true,
});

export const insertAuthorizationLogSchema = createInsertSchema(authorizationLogs).pick({
  userId: true,
  module: true,
  feature: true,
  fieldName: true,
  action: true,
  granted: true,
  reason: true,
  matchedRuleId: true,
  configId: true,
  ipAddress: true,
  userAgent: true,
  responseTime: true,
});

// Enhanced authorization types
export type InsertFeaturePermission = z.infer<typeof insertFeaturePermissionSchema>;
export type FeaturePermission = typeof featurePermissions.$inferSelect;

export type InsertFieldPermission = z.infer<typeof insertFieldPermissionSchema>;
export type FieldPermission = typeof fieldPermissions.$inferSelect;

export type InsertAuthorizationConfig = z.infer<typeof insertAuthorizationConfigSchema>;
export type AuthorizationConfig = typeof authorizationConfigs.$inferSelect;

export type InsertAuthorizationConfigAssignment = z.infer<typeof insertAuthorizationConfigAssignmentSchema>;
export type AuthorizationConfigAssignment = typeof authorizationConfigAssignments.$inferSelect;

export type InsertAuthorizationLog = z.infer<typeof insertAuthorizationLogSchema>;
export type AuthorizationLog = typeof authorizationLogs.$inferSelect;
