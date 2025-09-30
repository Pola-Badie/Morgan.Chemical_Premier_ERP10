import {
  User, InsertUser, UserPermission, InsertUserPermission,
  Product, InsertProduct, ProductCategory, InsertProductCategory,
  Customer, InsertCustomer, Supplier, InsertSupplier,
  Sale, InsertSale, SaleItem, InsertSaleItem,
  PurchaseOrder, InsertPurchaseOrder, PurchaseOrderItem,
  Backup, InsertBackup, BackupSettings, UpdateBackupSettings,
  InventoryTransaction, SalesReport, InsertSalesReport,
  SystemPreference, InsertSystemPreference, UpdateSystemPreference,
  RolePermission, InsertRolePermission, LoginLog, InsertLoginLog,
  Quotation, InsertQuotation, QuotationItem, InsertQuotationItem,
  Order, InsertOrder, OrderItem, InsertOrderItem, OrderFee, InsertOrderFee,
  Batch, InsertBatch, ProductFormulation, InsertProductFormulation,
  ProductSafety, InsertProductSafety, QualityTest, InsertQualityTest,
  ProductionOrder, InsertProductionOrder, ProductionMaterial,
  ProductLabel, InsertProductLabel, RegulatorySubmission, InsertRegulatorySubmission,
  InventoryAdjustment, InsertInventoryAdjustment, Warehouse, InsertWarehouse,
  WarehouseLocation, InsertWarehouseLocation, StockMovement, InsertStockMovement,
  Account, InsertAccount, JournalEntry, InsertJournalEntry, JournalLine, InsertJournalLine,
  FinancialPeriod, InsertFinancialPeriod, CustomerPayment, InsertCustomerPayment,
  PaymentAllocation, InsertPaymentAllocation, TaxRate, InsertTaxRate,
  Currency, InsertCurrency, BankAccount, InsertBankAccount,
  Budget, InsertBudget, BudgetCategory, Asset, InsertAsset, MaintenanceRecord,
  Department, InsertDepartment, EmployeeProfile, InsertEmployeeProfile,
  DocumentType, Document, InsertDocument, NotificationTemplate,
  Notification, InsertNotification
} from "../../shared/schema.js";

// User Management Interface
export interface IUserStorage {
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deactivateUser(id: number): Promise<boolean>;
  getUserPermissions(userId: number): Promise<UserPermission[]>;
  getUserPermissionsByModule(userId: number, moduleName: string): Promise<UserPermission | undefined>;
  createUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  updateUserPermission(userId: number, moduleName: string, accessGranted: boolean): Promise<UserPermission | undefined>;
  deleteUserPermission(userId: number, moduleName: string): Promise<boolean>;
}

// Product Management Interface
export interface IProductStorage {
  getProducts(filters?: { type?: string; status?: string; categoryId?: number }): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProductsByStatus(status: string): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getProductCategories(): Promise<ProductCategory[]>;
  getProductCategory(id: number): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, category: Partial<ProductCategory>): Promise<ProductCategory | undefined>;
  deleteProductCategory(id: number): Promise<boolean>;
}

// Customer Management Interface
export interface ICustomerStorage {
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
}

// Supplier Management Interface
export interface ISupplierStorage {
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
}

// Pharmaceutical-specific Interface
export interface IPharmaceuticalStorage {
  // Batch Management
  getBatches(filters?: { productId?: number; status?: string; supplierId?: number }): Promise<Batch[]>;
  getBatch(id: number): Promise<Batch | undefined>;
  getBatchByNumber(batchNumber: string): Promise<Batch | undefined>;
  getBatchesByProduct(productId: number): Promise<Batch[]>;
  getBatchesByStatus(status: string): Promise<Batch[]>;
  getExpiringBatches(days: number): Promise<Batch[]>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: number, data: Partial<Batch>): Promise<Batch | undefined>;
  deleteBatch(id: number): Promise<boolean>;

  // Product Formulation
  getProductFormulations(productId: number): Promise<ProductFormulation[]>;
  getFormulation(id: number): Promise<ProductFormulation | undefined>;
  createFormulation(formulation: InsertProductFormulation): Promise<ProductFormulation>;
  updateFormulation(id: number, data: Partial<ProductFormulation>): Promise<ProductFormulation | undefined>;
  deleteFormulation(id: number): Promise<boolean>;

  // Product Safety
  getProductSafety(productId: number): Promise<ProductSafety | undefined>;
  createProductSafety(safety: InsertProductSafety): Promise<ProductSafety>;
  updateProductSafety(productId: number, data: Partial<ProductSafety>): Promise<ProductSafety | undefined>;
  deleteProductSafety(productId: number): Promise<boolean>;

  // Quality Control
  getQualityTests(batchId?: number): Promise<QualityTest[]>;
  getQualityTest(id: number): Promise<QualityTest | undefined>;
  getQualityTestsByBatch(batchId: number): Promise<QualityTest[]>;
  createQualityTest(test: InsertQualityTest): Promise<QualityTest>;
  updateQualityTest(id: number, data: Partial<QualityTest>): Promise<QualityTest | undefined>;
  deleteQualityTest(id: number): Promise<boolean>;

  // Regulatory Submissions
  getRegulatorySubmissions(productId?: number, status?: string): Promise<RegulatorySubmission[]>;
  getRegulatorySubmission(id: number): Promise<RegulatorySubmission | undefined>;
  createRegulatorySubmission(submission: InsertRegulatorySubmission): Promise<RegulatorySubmission>;
  updateRegulatorySubmission(id: number, data: Partial<RegulatorySubmission>): Promise<RegulatorySubmission | undefined>;
  deleteRegulatorySubmission(id: number): Promise<boolean>;
}

// Financial Management Interface
export interface IFinancialStorage {
  // Accounts
  getAccounts(type?: string): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  getAccountByCode(code: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, data: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Journal Entries
  getJournalEntries(filters?: { dateFrom?: string; dateTo?: string; status?: string }): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  getJournalLines(journalId: number): Promise<JournalLine[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  createJournalLine(line: InsertJournalLine): Promise<JournalLine>;
  updateJournalEntry(id: number, data: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<boolean>;

  // Customer Payments
  getCustomerPayments(filters?: { customerId?: number; dateFrom?: string; dateTo?: string }): Promise<CustomerPayment[]>;
  getCustomerPayment(id: number): Promise<CustomerPayment | undefined>;
  getPaymentAllocations(paymentId: number): Promise<PaymentAllocation[]>;
  createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment>;
  createPaymentAllocation(allocation: InsertPaymentAllocation): Promise<PaymentAllocation>;
  updateCustomerPayment(id: number, data: Partial<CustomerPayment>): Promise<CustomerPayment | undefined>;
  deleteCustomerPayment(id: number): Promise<boolean>;
}

// Inventory Management Interface
export interface IInventoryStorage {
  // Warehouses
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  getWarehouseLocations(warehouseId?: number): Promise<WarehouseLocation[]>;
  getWarehouseLocation(id: number): Promise<WarehouseLocation | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  createWarehouseLocation(location: InsertWarehouseLocation): Promise<WarehouseLocation>;
  updateWarehouse(id: number, data: Partial<Warehouse>): Promise<Warehouse | undefined>;
  updateWarehouseLocation(id: number, data: Partial<WarehouseLocation>): Promise<WarehouseLocation | undefined>;
  deleteWarehouse(id: number): Promise<boolean>;
  deleteWarehouseLocation(id: number): Promise<boolean>;

  // Stock Movements
  getStockMovements(filters?: { productId?: number; dateFrom?: string; dateTo?: string }): Promise<StockMovement[]>;
  getStockMovement(id: number): Promise<StockMovement | undefined>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  updateStockMovement(id: number, data: Partial<StockMovement>): Promise<StockMovement | undefined>;
  deleteStockMovement(id: number): Promise<boolean>;

  // Inventory Adjustments
  getInventoryAdjustments(filters?: { productId?: number; dateFrom?: string; dateTo?: string }): Promise<InventoryAdjustment[]>;
  getInventoryAdjustment(id: number): Promise<InventoryAdjustment | undefined>;
  createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment>;
  updateInventoryAdjustment(id: number, data: Partial<InventoryAdjustment>): Promise<InventoryAdjustment | undefined>;
  deleteInventoryAdjustment(id: number): Promise<boolean>;
}

// Complete Storage Interface
export interface IStorage extends 
  IUserStorage, 
  IProductStorage, 
  ICustomerStorage, 
  ISupplierStorage, 
  IPharmaceuticalStorage,
  IFinancialStorage,
  IInventoryStorage {
  
  // Additional legacy methods that need to be organized
  getSales(query?: string, customerId?: number, status?: string): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  getSaleItems(saleId: number): Promise<SaleItem[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  createSaleItem(item: InsertSaleItem): Promise<SaleItem>;
  updateSale(id: number, data: Partial<Sale>): Promise<Sale | undefined>;
  deleteSale(id: number): Promise<boolean>;
  deleteSaleItems(saleId: number): Promise<boolean>;

  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined>;
  deletePurchaseOrder(id: number): Promise<boolean>;

  getInventoryTransactions(): Promise<InventoryTransaction[]>;
  createInventoryTransaction(transaction: Partial<InventoryTransaction>): Promise<InventoryTransaction>;

  getSalesReports(): Promise<SalesReport[]>;
  createSalesReport(report: InsertSalesReport): Promise<SalesReport>;

  getBackups(): Promise<Backup[]>;
  getBackupSettings(): Promise<BackupSettings | undefined>;
  updateBackupSettings(settings: UpdateBackupSettings): Promise<BackupSettings | undefined>;
  performBackup(type: string): Promise<Backup>;
  restoreFromBackup(backupId: number): Promise<boolean>;

  getSystemPreferences(): Promise<SystemPreference[]>;
  getSystemPreferencesByCategory(category: string): Promise<SystemPreference[]>;
  getSystemPreference(key: string): Promise<SystemPreference | undefined>;
  createSystemPreference(preference: InsertSystemPreference): Promise<SystemPreference>;
  updateSystemPreference(key: string, value: any): Promise<SystemPreference | undefined>;

  getRolePermissions(role: string): Promise<RolePermission[]>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;
  deleteRolePermission(id: number): Promise<boolean>;

  getLoginLogs(limit?: number): Promise<LoginLog[]>;
  createLoginLog(log: InsertLoginLog): Promise<LoginLog>;

  getQuotations(query: string, status: string, date: string): Promise<Quotation[]>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  getQuotationItems(quotationId: number): Promise<QuotationItem[]>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  updateQuotation(id: number, data: Partial<Quotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: number): Promise<boolean>;
  deleteQuotationItems(quotationId: number): Promise<boolean>;

  getOrders(query?: string, orderType?: string, status?: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getOrderFees(orderId: number): Promise<OrderFee[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  createOrderFee(fee: InsertOrderFee): Promise<OrderFee>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  deleteOrderItems(orderId: number): Promise<boolean>;
  deleteOrderFees(orderId: number): Promise<boolean>;
}