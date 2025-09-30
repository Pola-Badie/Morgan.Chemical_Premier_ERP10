import { UserStorage } from "./user-storage";
import { ProductStorage } from "./product-storage";
import { PharmaceuticalStorage } from "./pharmaceutical-storage";
import { FinancialStorage } from "./financial-storage";
import { IStorage } from "./interfaces";
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { and, asc, count, desc, eq, gte, lte, sql, sum, like } from "drizzle-orm";
import { db } from "../db";
import {
  customers, suppliers, sales, saleItems, purchaseOrders, purchaseOrderItems,
  backups, backupSettings, inventoryTransactions, salesReports, systemPreferences,
  quotations, quotationItems, orders, orderItems, orderFees, warehouses, warehouseLocations,
  stockMovements, inventoryAdjustments, products, productCategories,
  type Customer, type InsertCustomer, type Supplier, type InsertSupplier,
  type Sale, type InsertSale, type SaleItem, type InsertSaleItem,
  type PurchaseOrder, type InsertPurchaseOrder, type PurchaseOrderItem,
  type Backup, type InsertBackup, type BackupSettings, type UpdateBackupSettings,
  type InventoryTransaction, type SalesReport, type InsertSalesReport,
  type SystemPreference, type InsertSystemPreference, type UpdateSystemPreference,
  type Quotation, type InsertQuotation, type QuotationItem, type InsertQuotationItem,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type OrderFee, type InsertOrderFee, type Warehouse, type InsertWarehouse,
  type WarehouseLocation, type InsertWarehouseLocation, type StockMovement, type InsertStockMovement,
  type InventoryAdjustment, type InsertInventoryAdjustment
} from "../../shared/schema.js";

export class DatabaseStorage implements IStorage {
  private userStorage = new UserStorage();
  private productStorage = new ProductStorage();
  private pharmaceuticalStorage = new PharmaceuticalStorage();
  private financialStorage = new FinancialStorage();
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    fs.mkdir(this.backupDir, { recursive: true }).catch(err => {
      console.error('Failed to create backup directory:', err);
    });
  }

  // Delegate User Management methods
  getUsers = () => this.userStorage.getUsers();
  getUser = (id: number) => this.userStorage.getUser(id);
  getUserByUsername = (username: string) => this.userStorage.getUserByUsername(username);
  createUser = (user: any) => this.userStorage.createUser(user);
  updateUser = (id: number, user: any) => this.userStorage.updateUser(id, user);
  deactivateUser = (id: number) => this.userStorage.deactivateUser(id);
  getUserPermissions = (userId: number) => this.userStorage.getUserPermissions(userId);
  getUserPermissionsByModule = (userId: number, moduleName: string) => this.userStorage.getUserPermissionsByModule(userId, moduleName);
  createUserPermission = (permission: any) => this.userStorage.createUserPermission(permission);
  updateUserPermission = (userId: number, moduleName: string, accessGranted: boolean) => this.userStorage.updateUserPermission(userId, moduleName, accessGranted);
  deleteUserPermission = (userId: number, moduleName: string) => this.userStorage.deleteUserPermission(userId, moduleName);
  getRolePermissions = (role: string) => this.userStorage.getRolePermissions(role);
  createRolePermission = (permission: any) => this.userStorage.createRolePermission(permission);
  deleteRolePermission = (id: number) => this.userStorage.deleteRolePermission(id);
  getLoginLogs = (limit?: number) => this.userStorage.getLoginLogs(limit);
  createLoginLog = (log: any) => this.userStorage.createLoginLog(log);

  // Delegate Product Management methods
  getProducts = (filters?: any) => this.productStorage.getProducts(filters);
  getProductsByCategory = (categoryId: number) => this.productStorage.getProductsByCategory(categoryId);
  getProductsByStatus = (status: string) => this.productStorage.getProductsByStatus(status);
  getLowStockProducts = () => this.productStorage.getLowStockProducts();
  getProduct = (id: number) => this.productStorage.getProduct(id);
  getProductBySku = (sku: string) => this.productStorage.getProductBySku(sku);
  createProduct = (product: any) => this.productStorage.createProduct(product);
  updateProduct = (id: number, product: any) => this.productStorage.updateProduct(id, product);
  deleteProduct = (id: number) => this.productStorage.deleteProduct(id);
  getProductCategories = () => this.productStorage.getProductCategories();
  getProductCategory = (id: number) => this.productStorage.getProductCategory(id);
  createProductCategory = (category: any) => this.productStorage.createProductCategory(category);
  updateProductCategory = (id: number, category: any) => this.productStorage.updateProductCategory(id, category);
  deleteProductCategory = (id: number) => this.productStorage.deleteProductCategory(id);

  // Delegate Pharmaceutical methods
  getBatches = (filters?: any) => this.pharmaceuticalStorage.getBatches(filters);
  getBatch = (id: number) => this.pharmaceuticalStorage.getBatch(id);
  getBatchByNumber = (batchNumber: string) => this.pharmaceuticalStorage.getBatchByNumber(batchNumber);
  getBatchesByProduct = (productId: number) => this.pharmaceuticalStorage.getBatchesByProduct(productId);
  getBatchesByStatus = (status: string) => this.pharmaceuticalStorage.getBatchesByStatus(status);
  getExpiringBatches = (days: number) => this.pharmaceuticalStorage.getExpiringBatches(days);
  createBatch = (batch: any) => this.pharmaceuticalStorage.createBatch(batch);
  updateBatch = (id: number, data: any) => this.pharmaceuticalStorage.updateBatch(id, data);
  deleteBatch = (id: number) => this.pharmaceuticalStorage.deleteBatch(id);
  getProductFormulations = (productId: number) => this.pharmaceuticalStorage.getProductFormulations(productId);
  getFormulation = (id: number) => this.pharmaceuticalStorage.getFormulation(id);
  createFormulation = (formulation: any) => this.pharmaceuticalStorage.createFormulation(formulation);
  updateFormulation = (id: number, data: any) => this.pharmaceuticalStorage.updateFormulation(id, data);
  deleteFormulation = (id: number) => this.pharmaceuticalStorage.deleteFormulation(id);
  getProductSafety = (productId: number) => this.pharmaceuticalStorage.getProductSafety(productId);
  createProductSafety = (safety: any) => this.pharmaceuticalStorage.createProductSafety(safety);
  updateProductSafety = (productId: number, data: any) => this.pharmaceuticalStorage.updateProductSafety(productId, data);
  deleteProductSafety = (productId: number) => this.pharmaceuticalStorage.deleteProductSafety(productId);
  getQualityTests = (batchId?: number) => this.pharmaceuticalStorage.getQualityTests(batchId);
  getQualityTest = (id: number) => this.pharmaceuticalStorage.getQualityTest(id);
  getQualityTestsByBatch = (batchId: number) => this.pharmaceuticalStorage.getQualityTestsByBatch(batchId);
  createQualityTest = (test: any) => this.pharmaceuticalStorage.createQualityTest(test);
  updateQualityTest = (id: number, data: any) => this.pharmaceuticalStorage.updateQualityTest(id, data);
  deleteQualityTest = (id: number) => this.pharmaceuticalStorage.deleteQualityTest(id);
  getRegulatorySubmissions = (productId?: number, status?: string) => this.pharmaceuticalStorage.getRegulatorySubmissions(productId, status);
  getRegulatorySubmission = (id: number) => this.pharmaceuticalStorage.getRegulatorySubmission(id);
  createRegulatorySubmission = (submission: any) => this.pharmaceuticalStorage.createRegulatorySubmission(submission);
  updateRegulatorySubmission = (id: number, data: any) => this.pharmaceuticalStorage.updateRegulatorySubmission(id, data);
  deleteRegulatorySubmission = (id: number) => this.pharmaceuticalStorage.deleteRegulatorySubmission(id);

  // Delegate Financial methods
  getAccounts = (type?: string) => this.financialStorage.getAccounts(type);
  getAccount = (id: number) => this.financialStorage.getAccount(id);
  getAccountByCode = (code: string) => this.financialStorage.getAccountByCode(code);
  createAccount = (account: any) => this.financialStorage.createAccount(account);
  updateAccount = (id: number, data: any) => this.financialStorage.updateAccount(id, data);
  deleteAccount = (id: number) => this.financialStorage.deleteAccount(id);
  getJournalEntries = (filters?: any) => this.financialStorage.getJournalEntries(filters);
  getJournalEntry = (id: number) => this.financialStorage.getJournalEntry(id);
  getJournalLines = (journalId: number) => this.financialStorage.getJournalLines(journalId);
  createJournalEntry = (entry: any) => this.financialStorage.createJournalEntry(entry);
  createJournalLine = (line: any) => this.financialStorage.createJournalLine(line);
  updateJournalEntry = (id: number, data: any) => this.financialStorage.updateJournalEntry(id, data);
  deleteJournalEntry = (id: number) => this.financialStorage.deleteJournalEntry(id);
  getCustomerPayments = (filters?: any) => this.financialStorage.getCustomerPayments(filters);
  getCustomerPayment = (id: number) => this.financialStorage.getCustomerPayment(id);
  getPaymentAllocations = (paymentId: number) => this.financialStorage.getPaymentAllocations(paymentId);
  createCustomerPayment = (payment: any) => this.financialStorage.createCustomerPayment(payment);
  createPaymentAllocation = (allocation: any) => this.financialStorage.createPaymentAllocation(allocation);
  updateCustomerPayment = (id: number, data: any) => this.financialStorage.updateCustomerPayment(id, data);
  deleteCustomerPayment = (id: number) => this.financialStorage.deleteCustomerPayment(id);

  // Customer Management - Direct implementation
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(customers.name);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  // Supplier Management - Direct implementation
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplierData: Partial<Supplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers)
      .set({ ...supplierData, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updated;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    return result.length > 0;
  }

  // Sales Management
  async getSales(query?: string, customerId?: number, status?: string): Promise<Sale[]> {
    let dbQuery = db.select().from(sales);
    const conditions = [];

    if (query) {
      conditions.push(like(sales.invoiceNumber, `%${query}%`));
    }
    if (customerId) {
      conditions.push(eq(sales.customerId, customerId));
    }
    if (status) {
      conditions.push(eq(sales.paymentStatus, status));
    }

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions)) as any;
    }

    return await dbQuery.orderBy(desc(sales.createdAt));
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    return newSale;
  }

  async createSaleItem(item: InsertSaleItem): Promise<SaleItem> {
    const [newItem] = await db.insert(saleItems).values(item).returning();
    return newItem;
  }

  async updateSale(id: number, data: Partial<Sale>): Promise<Sale | undefined> {
    const [updated] = await db.update(sales)
      .set({ ...data })
      .where(eq(sales.id, id))
      .returning();
    return updated;
  }

  async deleteSale(id: number): Promise<boolean> {
    const result = await db.delete(sales).where(eq(sales.id, id)).returning();
    return result.length > 0;
  }

  async deleteSaleItems(saleId: number): Promise<boolean> {
    const result = await db.delete(saleItems).where(eq(saleItems.saleId, saleId)).returning();
    return result.length > 0;
  }

  // Warehouse and Inventory Management
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses).where(eq(warehouses.isActive, true));
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async getWarehouseLocations(warehouseId?: number): Promise<WarehouseLocation[]> {
    if (warehouseId) {
      return await db.select().from(warehouseLocations)
        .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.isActive, true)));
    }
    return await db.select().from(warehouseLocations).where(eq(warehouseLocations.isActive, true));
  }

  async getWarehouseLocation(id: number): Promise<WarehouseLocation | undefined> {
    const [location] = await db.select().from(warehouseLocations).where(eq(warehouseLocations.id, id));
    return location;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [newWarehouse] = await db.insert(warehouses).values(warehouse).returning();
    return newWarehouse;
  }

  async createWarehouseLocation(location: InsertWarehouseLocation): Promise<WarehouseLocation> {
    const [newLocation] = await db.insert(warehouseLocations).values(location).returning();
    return newLocation;
  }

  async updateWarehouse(id: number, data: Partial<Warehouse>): Promise<Warehouse | undefined> {
    const [updated] = await db.update(warehouses)
      .set(data)
      .where(eq(warehouses.id, id))
      .returning();
    return updated;
  }

  async updateWarehouseLocation(id: number, data: Partial<WarehouseLocation>): Promise<WarehouseLocation | undefined> {
    const [updated] = await db.update(warehouseLocations)
      .set(data)
      .where(eq(warehouseLocations.id, id))
      .returning();
    return updated;
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    const [updated] = await db.update(warehouses)
      .set({ isActive: false })
      .where(eq(warehouses.id, id))
      .returning();
    return updated !== undefined;
  }

  async deleteWarehouseLocation(id: number): Promise<boolean> {
    const [updated] = await db.update(warehouseLocations)
      .set({ isActive: false })
      .where(eq(warehouseLocations.id, id))
      .returning();
    return updated !== undefined;
  }

  async getStockMovements(filters?: { productId?: number; dateFrom?: string; dateTo?: string }): Promise<StockMovement[]> {
    const conditions = [];

    if (filters?.productId) {
      conditions.push(eq(stockMovements.productId, filters.productId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(stockMovements.movementDate, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(stockMovements.movementDate, new Date(filters.dateTo)));
    }

    if (conditions.length > 0) {
      return await db.select().from(stockMovements)
        .where(and(...conditions))
        .orderBy(desc(stockMovements.movementDate));
    }

    return await db.select().from(stockMovements).orderBy(desc(stockMovements.movementDate));
  }

  async getStockMovement(id: number): Promise<StockMovement | undefined> {
    const [movement] = await db.select().from(stockMovements).where(eq(stockMovements.id, id));
    return movement;
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [newMovement] = await db.insert(stockMovements).values(movement).returning();
    return newMovement;
  }

  async updateStockMovement(id: number, data: Partial<StockMovement>): Promise<StockMovement | undefined> {
    const [updated] = await db.update(stockMovements)
      .set(data)
      .where(eq(stockMovements.id, id))
      .returning();
    return updated;
  }

  async deleteStockMovement(id: number): Promise<boolean> {
    const result = await db.delete(stockMovements).where(eq(stockMovements.id, id)).returning();
    return result.length > 0;
  }

  async getInventoryAdjustments(filters?: { productId?: number; dateFrom?: string; dateTo?: string }): Promise<InventoryAdjustment[]> {
    const conditions = [];

    if (filters?.productId) {
      conditions.push(eq(inventoryAdjustments.productId, filters.productId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(inventoryAdjustments.adjustmentDate, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(inventoryAdjustments.adjustmentDate, new Date(filters.dateTo)));
    }

    if (conditions.length > 0) {
      return await db.select().from(inventoryAdjustments)
        .where(and(...conditions))
        .orderBy(desc(inventoryAdjustments.adjustmentDate));
    }

    return await db.select().from(inventoryAdjustments).orderBy(desc(inventoryAdjustments.adjustmentDate));
  }

  async getInventoryAdjustment(id: number): Promise<InventoryAdjustment | undefined> {
    const [adjustment] = await db.select().from(inventoryAdjustments).where(eq(inventoryAdjustments.id, id));
    return adjustment;
  }

  async createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment> {
    const [newAdjustment] = await db.insert(inventoryAdjustments).values(adjustment).returning();
    return newAdjustment;
  }

  async updateInventoryAdjustment(id: number, data: Partial<InventoryAdjustment>): Promise<InventoryAdjustment | undefined> {
    const [updated] = await db.update(inventoryAdjustments)
      .set(data)
      .where(eq(inventoryAdjustments.id, id))
      .returning();
    return updated;
  }

  async deleteInventoryAdjustment(id: number): Promise<boolean> {
    const result = await db.delete(inventoryAdjustments).where(eq(inventoryAdjustments.id, id)).returning();
    return result.length > 0;
  }

  // Legacy method implementations that need to be maintained for backward compatibility
  // These methods are kept minimal and delegate to appropriate modular storage when possible

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
  }

  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return order;
  }

  async getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
    return await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
  }

  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [newOrder] = await db.insert(purchaseOrders).values(order).returning();
    return newOrder;
  }

  async updatePurchaseOrder(id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const [updated] = await db.update(purchaseOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updated;
  }

  async deletePurchaseOrder(id: number): Promise<boolean> {
    const result = await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id)).returning();
    return result.length > 0;
  }

  async getInventoryTransactions(): Promise<InventoryTransaction[]> {
    return await db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.date));
  }

  async createInventoryTransaction(transaction: Partial<InventoryTransaction>): Promise<InventoryTransaction> {
    const [newTransaction] = await db.insert(inventoryTransactions).values(transaction as any).returning();
    return newTransaction;
  }

  async getSalesReports(): Promise<SalesReport[]> {
    return await db.select().from(salesReports).orderBy(desc(salesReports.createdAt));
  }

  async createSalesReport(report: InsertSalesReport): Promise<SalesReport> {
    const [newReport] = await db.insert(salesReports).values(report).returning();
    return newReport;
  }

  async getBackups(): Promise<Backup[]> {
    return await db.select().from(backups).orderBy(desc(backups.timestamp));
  }

  async getLatestBackup(): Promise<Backup | undefined> {
    const [latest] = await db.select().from(backups)
      .where(eq(backups.status, 'completed'))
      .orderBy(desc(backups.timestamp))
      .limit(1);
    return latest;
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      // Keep only the last 10 successful backups
      const oldBackups = await db.select().from(backups)
        .orderBy(desc(backups.timestamp))
        .offset(10);

      for (const backup of oldBackups) {
        try {
          // Delete backup files from filesystem (using filename as path)
          const backupPath = path.join(this.backupDir, backup.filename);
          await fs.unlink(backupPath).catch(() => { });

          // Delete backup record from database
          await db.delete(backups).where(eq(backups.id, backup.id));
          console.log(`🔥 BACKUP CLEANUP: Removed old backup ${backup.filename}`);
        } catch (error) {
          console.error(`🔥 BACKUP CLEANUP ERROR: Failed to delete backup ${backup.filename}:`, error);
        }
      }
    } catch (error) {
      console.error('🔥 BACKUP CLEANUP ERROR: Failed to cleanup old backups:', error);
    }
  }

  async getBackupSettings(): Promise<BackupSettings | undefined> {
    const [settings] = await db.select().from(backupSettings).limit(1);
    return settings;
  }

  async updateBackupSettings(settings: UpdateBackupSettings): Promise<BackupSettings | undefined> {
    const [updated] = await db.update(backupSettings)
      .set(settings)
      .returning();
    return updated;
  }

  async performBackup(type: string): Promise<Backup> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dbBackupFilename = `backup_${timestamp}.sql`;
    const uploadsBackupFilename = `uploads_${timestamp}.tar.gz`;
    const dbBackupPath = path.join(this.backupDir, dbBackupFilename);
    const uploadsBackupPath = path.join(this.backupDir, uploadsBackupFilename);

    try {
      console.log('🔥 BACKUP: Starting real backup process...');

      // Create backup directory if it doesn't exist
      await fs.mkdir(this.backupDir, { recursive: true });

      // 1. Backup database using pg_dump
      console.log('🔥 BACKUP: Creating database backup...');

      const dbResult = await new Promise<boolean>((resolve) => {
        const pgDump = spawn('pg_dump', [
          '--verbose',
          '--clean',
          '--no-owner',
          '--no-privileges',
          '--format=plain',
          `--file=${dbBackupPath}`,
          process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
        ], {
          env: {
            ...process.env,
            PGPASSWORD: process.env.PGPASSWORD
          }
        });

        pgDump.on('close', (code) => {
          console.log(`🔥 BACKUP: pg_dump process exited with code ${code}`);
          resolve(code === 0);
        });

        pgDump.on('error', (error) => {
          console.error('🔥 BACKUP ERROR: pg_dump failed:', error);
          resolve(false);
        });
      });

      if (!dbResult) {
        throw new Error('Database backup failed');
      }

      // 2. Backup uploads directory if it exists
      console.log('🔥 BACKUP: Creating uploads backup...');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      let uploadsResult = true;

      try {
        await fs.access(uploadsDir);
        uploadsResult = await new Promise<boolean>((resolve) => {
          const tar = spawn('tar', [
            '-czf',
            uploadsBackupPath,
            '-C',
            process.cwd(),
            'uploads'
          ]);

          tar.on('close', (code) => {
            console.log(`🔥 BACKUP: tar process exited with code ${code}`);
            resolve(code === 0);
          });

          tar.on('error', (error) => {
            console.error('🔥 BACKUP ERROR: tar failed:', error);
            resolve(false);
          });
        });
      } catch (error) {
        console.log('🔥 BACKUP: No uploads directory found, skipping...');
        // Create empty file to maintain consistency
        await fs.writeFile(uploadsBackupPath, '');
      }

      // 3. Calculate backup sizes
      let dbSize = 0;
      let uploadsSize = 0;

      try {
        const dbStats = await fs.stat(dbBackupPath);
        dbSize = dbStats.size;

        const uploadsStats = await fs.stat(uploadsBackupPath);
        uploadsSize = uploadsStats.size;
      } catch (error) {
        console.error('🔥 BACKUP WARNING: Could not get file sizes:', error);
      }

      // 4. Clean up old backups (keep last 10)
      await this.cleanupOldBackups();

      // 5. Create backup record
      const backupData = {
        filename: dbBackupFilename,
        type,
        status: (dbResult && uploadsResult) ? 'completed' as const : 'failed' as const,
        size: dbSize,
        timestamp: new Date()
      };

      const [backup] = await db.insert(backups).values(backupData).returning();

      console.log(`🔥 BACKUP: ${backup.status === 'completed' ? 'SUCCESS' : 'FAILED'}`);
      console.log(`🔥 BACKUP: Database: ${(dbSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`🔥 BACKUP: Uploads: ${(uploadsSize / 1024 / 1024).toFixed(2)} MB`);

      return backup;

    } catch (error) {
      console.error('🔥 BACKUP ERROR: Backup failed:', error);

      // Create failed backup record
      const backupData = {
        filename: dbBackupFilename,
        type,
        status: 'failed' as const,
        size: 0,
        timestamp: new Date()
      };

      const [backup] = await db.insert(backups).values(backupData).returning();
      return backup;
    }
  }

  async restoreFromBackup(backupId: number): Promise<boolean> {
    try {
      console.log('🔥 RESTORE: Starting database restore process...');

      // Get backup details
      const [backup] = await db.select().from(backups).where(eq(backups.id, backupId));
      if (!backup) {
        console.error('🔥 RESTORE ERROR: Backup not found');
        return false;
      }

      if (backup.status !== 'completed') {
        console.error('🔥 RESTORE ERROR: Cannot restore from incomplete backup');
        return false;
      }

      // Check if backup file exists
      const backupPath = path.join(this.backupDir, backup.filename);
      try {
        await fs.access(backupPath);
      } catch (error) {
        console.error('🔥 RESTORE ERROR: Backup file not found:', backupPath);
        return false;
      }

      console.log('🔥 RESTORE: Restoring database from:', backupPath);

      // Restore database using psql
      const restoreResult = await new Promise<boolean>((resolve) => {
        const psql = spawn('psql', [
          '--quiet',
          '--file=' + backupPath,
          process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
        ], {
          env: {
            ...process.env,
            PGPASSWORD: process.env.PGPASSWORD
          }
        });

        psql.on('close', (code) => {
          console.log(`🔥 RESTORE: psql process exited with code ${code}`);
          resolve(code === 0);
        });

        psql.on('error', (error) => {
          console.error('🔥 RESTORE ERROR: psql failed:', error);
          resolve(false);
        });
      });

      if (!restoreResult) {
        console.error('🔥 RESTORE ERROR: Database restore failed');
        return false;
      }

      // Try to restore uploads if available (based on filename pattern)
      const uploadsBackupFilename = backup.filename.replace('backup_', 'uploads_').replace('.sql', '.tar.gz');
      const uploadsBackupPath = path.join(this.backupDir, uploadsBackupFilename);

      try {
        await fs.access(uploadsBackupPath);
        console.log('🔥 RESTORE: Restoring uploads from:', uploadsBackupPath);

        const uploadsRestoreResult = await new Promise<boolean>((resolve) => {
          const tar = spawn('tar', [
            '-xzf',
            uploadsBackupPath,
            '-C',
            process.cwd()
          ]);

          tar.on('close', (code) => {
            console.log(`🔥 RESTORE: tar process exited with code ${code}`);
            resolve(code === 0);
          });

          tar.on('error', (error) => {
            console.error('🔥 RESTORE WARNING: uploads restore failed:', error);
            resolve(true); // Don't fail the entire restore for uploads
          });
        });

        if (uploadsRestoreResult) {
          console.log('🔥 RESTORE: Uploads restored successfully');
        }
      } catch (error) {
        console.log('🔥 RESTORE: No uploads backup found, skipping...');
      }

      console.log('🔥 RESTORE: Database restore completed successfully');
      return true;

    } catch (error) {
      console.error('🔥 RESTORE ERROR: Restore failed:', error);
      return false;
    }
  }

  async getSystemPreferences(): Promise<SystemPreference[]> {
    return await db.select().from(systemPreferences);
  }

  async getSystemPreferencesByCategory(category: string): Promise<SystemPreference[]> {
    return await db.select().from(systemPreferences).where(eq(systemPreferences.category, category));
  }

  async getSystemPreference(key: string): Promise<SystemPreference | undefined> {
    const [preference] = await db.select().from(systemPreferences).where(eq(systemPreferences.key, key));
    return preference;
  }

  async createSystemPreference(preference: InsertSystemPreference): Promise<SystemPreference> {
    const [newPreference] = await db.insert(systemPreferences).values(preference).returning();
    return newPreference;
  }

  async updateSystemPreference(key: string, value: any): Promise<SystemPreference | undefined> {
    const [updated] = await db.update(systemPreferences)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemPreferences.key, key))
      .returning();
    return updated;
  }

  async getQuotations(query: string, status: string, date: string): Promise<Quotation[]> {
    let dbQuery = db.select().from(quotations);
    const conditions = [];

    if (query) {
      conditions.push(like(quotations.quotationNumber, `%${query}%`));
    }
    if (status) {
      conditions.push(eq(quotations.status, status));
    }
    if (date) {
      conditions.push(eq(quotations.validUntil, date));
    }

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions)) as any;
    }

    return await dbQuery.orderBy(desc(quotations.createdAt));
  }

  async getQuotation(id: number): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    return quotation;
  }

  async getQuotationItems(quotationId: number): Promise<QuotationItem[]> {
    return await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const [newQuotation] = await db.insert(quotations).values({
      ...quotation,
      totalAmount: quotation.grandTotal
    }).returning();
    return newQuotation;
  }

  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> {
    const [newItem] = await db.insert(quotationItems).values(item).returning();
    return newItem;
  }

  async updateQuotation(id: number, data: Partial<Quotation>): Promise<Quotation | undefined> {
    const [updated] = await db.update(quotations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quotations.id, id))
      .returning();
    return updated;
  }

  async deleteQuotation(id: number): Promise<boolean> {
    const result = await db.delete(quotations).where(eq(quotations.id, id)).returning();
    return result.length > 0;
  }

  async deleteQuotationItems(quotationId: number): Promise<boolean> {
    const result = await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId)).returning();
    return result.length > 0;
  }

  async getOrders(query?: string, orderType?: string, status?: string): Promise<Order[]> {
    let dbQuery = db.select().from(orders);
    const conditions = [];

    if (query) {
      conditions.push(like(orders.orderNumber, `%${query}%`));
    }
    if (orderType) {
      conditions.push(eq(orders.orderType, orderType));
    }
    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions)) as any;
    }

    return await dbQuery.orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getOrderFees(orderId: number): Promise<OrderFee[]> {
    return await db.select().from(orderFees).where(eq(orderFees.orderId, orderId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  async createOrderFee(fee: InsertOrderFee): Promise<OrderFee> {
    const [newFee] = await db.insert(orderFees).values(fee).returning();
    return newFee;
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id)).returning();
    return result.length > 0;
  }

  async deleteOrderItems(orderId: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.orderId, orderId)).returning();
    return result.length > 0;
  }

  async deleteOrderFees(orderId: number): Promise<boolean> {
    const result = await db.delete(orderFees).where(eq(orderFees.orderId, orderId)).returning();
    return result.length > 0;
  }

  // Production Management - Stub implementations
  async getProductionOrders(filters?: any): Promise<any[]> {
    throw new Error("Production orders not implemented yet");
  }

  async getProductionOrder(id: number): Promise<any> {
    throw new Error("Production orders not implemented yet");
  }

  async getProductionMaterials(id: number): Promise<any[]> {
    throw new Error("Production materials not implemented yet");
  }

  async createProductionOrder(data: any): Promise<any> {
    throw new Error("Production orders not implemented yet");
  }

  async updateProductionOrder(id: number, data: any): Promise<any> {
    throw new Error("Production orders not implemented yet");
  }

  async deleteProductionOrder(id: number): Promise<boolean> {
    throw new Error("Production orders not implemented yet");
  }

  // Tax Management - Stub implementations
  async getTaxRates(active?: boolean): Promise<any[]> {
    throw new Error("Tax rates not implemented yet");
  }

  async createTaxRate(data: any): Promise<any> {
    throw new Error("Tax rates not implemented yet");
  }

  // Currency Management - Stub implementations
  async getCurrencies(active?: boolean): Promise<any[]> {
    throw new Error("Currencies not implemented yet");
  }

  async getBaseCurrency(): Promise<any> {
    throw new Error("Base currency not implemented yet");
  }

  async createCurrency(data: any): Promise<any> {
    throw new Error("Currencies not implemented yet");
  }

  // Bank Account Management - Stub implementations
  async getBankAccounts(active?: boolean): Promise<any[]> {
    throw new Error("Bank accounts not implemented yet");
  }

  async createBankAccount(data: any): Promise<any> {
    throw new Error("Bank accounts not implemented yet");
  }

  // Budget Management - Stub implementations
  async getBudgets(year?: number): Promise<any[]> {
    throw new Error("Budgets not implemented yet");
  }

  async getBudgetCategories(budgetId: number): Promise<any[]> {
    throw new Error("Budget categories not implemented yet");
  }

  async createBudget(data: any): Promise<any> {
    throw new Error("Budgets not implemented yet");
  }

  // Asset Management - Stub implementations
  async getAssets(category?: string, status?: string): Promise<any[]> {
    throw new Error("Assets not implemented yet");
  }

  async getMaintenanceRecords(assetId: number): Promise<any[]> {
    throw new Error("Maintenance records not implemented yet");
  }

  async createAsset(data: any): Promise<any> {
    throw new Error("Assets not implemented yet");
  }

  // Department Management - Stub implementations
  async getDepartments(active?: boolean): Promise<any[]> {
    throw new Error("Departments not implemented yet");
  }

  async createDepartment(data: any): Promise<any> {
    throw new Error("Departments not implemented yet");
  }

  // Employee Management - Stub implementations
  async getEmployeeProfiles(departmentId?: number): Promise<any[]> {
    throw new Error("Employee profiles not implemented yet");
  }

  async getEmployeeByUserId(userId: number): Promise<any> {
    throw new Error("Employee profiles not implemented yet");
  }

  async createEmployeeProfile(data: any): Promise<any> {
    throw new Error("Employee profiles not implemented yet");
  }

  // Document Management - Stub implementations
  async getDocuments(entityType?: string, entityId?: number): Promise<any[]> {
    throw new Error("Documents not implemented yet");
  }

  async getDocumentTypes(): Promise<any[]> {
    throw new Error("Document types not implemented yet");
  }

  async createDocument(data: any): Promise<any> {
    throw new Error("Documents not implemented yet");
  }

  // Notification Management - Stub implementations
  async getNotifications(userId?: number, unreadOnly?: boolean): Promise<any[]> {
    throw new Error("Notifications not implemented yet");
  }

  async getNotificationTemplates(): Promise<any[]> {
    throw new Error("Notification templates not implemented yet");
  }

  async createNotification(data: any): Promise<any> {
    throw new Error("Notifications not implemented yet");
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    throw new Error("Notifications not implemented yet");
  }
}

export const storage = new DatabaseStorage();