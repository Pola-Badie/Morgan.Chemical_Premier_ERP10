import { Router } from "express";
import { storage } from "./storage";
import { 
  insertBatchSchema, insertProductFormulationSchema, insertProductSafetySchema,
  insertQualityTestSchema, insertProductionOrderSchema, insertProductLabelSchema,
  insertRegulatorySubmissionSchema, insertInventoryAdjustmentSchema, insertWarehouseSchema,
  insertWarehouseLocationSchema, insertStockMovementSchema, insertAccountSchema,
  insertJournalEntrySchema, insertJournalLineSchema, insertFinancialPeriodSchema,
  insertCustomerPaymentSchema, insertPaymentAllocationSchema, insertTaxRateSchema,
  insertCurrencySchema, insertBankAccountSchema, insertBudgetSchema, insertAssetSchema,
  insertDepartmentSchema, insertEmployeeProfileSchema, insertDocumentSchema,
  insertNotificationSchema
} from "@shared/schema";

const router = Router();

// Batch Management endpoints
router.get("/batches", async (req, res) => {
  try {
    const filters = {
      productId: req.query.productId ? parseInt(req.query.productId as string) : undefined,
      status: req.query.status as string,
      supplierId: req.query.supplierId ? parseInt(req.query.supplierId as string) : undefined
    };
    const batches = await storage.getBatches(filters);
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch batches" });
  }
});

router.get("/batches/:id", async (req, res) => {
  try {
    const batch = await storage.getBatch(parseInt(req.params.id));
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch batch" });
  }
});

router.get("/batches/number/:batchNumber", async (req, res) => {
  try {
    const batch = await storage.getBatchByNumber(req.params.batchNumber);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch batch" });
  }
});

router.get("/batches/expiring/:days", async (req, res) => {
  try {
    const days = parseInt(req.params.days);
    const batches = await storage.getExpiringBatches(days);
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expiring batches" });
  }
});

router.post("/batches", async (req, res) => {
  try {
    const validatedData = insertBatchSchema.parse(req.body);
    const batch = await storage.createBatch(validatedData);
    res.status(201).json(batch);
  } catch (error) {
    res.status(400).json({ error: "Invalid batch data" });
  }
});

router.put("/batches/:id", async (req, res) => {
  try {
    const batch = await storage.updateBatch(parseInt(req.params.id), req.body);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: "Failed to update batch" });
  }
});

router.delete("/batches/:id", async (req, res) => {
  try {
    const success = await storage.deleteBatch(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete batch" });
  }
});

// Product Formulation endpoints
router.get("/products/:productId/formulations", async (req, res) => {
  try {
    const formulations = await storage.getProductFormulations(parseInt(req.params.productId));
    res.json(formulations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch formulations" });
  }
});

router.get("/formulations/:id", async (req, res) => {
  try {
    const formulation = await storage.getFormulation(parseInt(req.params.id));
    if (!formulation) {
      return res.status(404).json({ error: "Formulation not found" });
    }
    res.json(formulation);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch formulation" });
  }
});

router.post("/formulations", async (req, res) => {
  try {
    const validatedData = insertProductFormulationSchema.parse(req.body);
    const formulation = await storage.createFormulation(validatedData);
    res.status(201).json(formulation);
  } catch (error) {
    res.status(400).json({ error: "Invalid formulation data" });
  }
});

router.put("/formulations/:id", async (req, res) => {
  try {
    const formulation = await storage.updateFormulation(parseInt(req.params.id), req.body);
    if (!formulation) {
      return res.status(404).json({ error: "Formulation not found" });
    }
    res.json(formulation);
  } catch (error) {
    res.status(500).json({ error: "Failed to update formulation" });
  }
});

router.delete("/formulations/:id", async (req, res) => {
  try {
    const success = await storage.deleteFormulation(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Formulation not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete formulation" });
  }
});

// Product Safety endpoints
router.get("/products/:productId/safety", async (req, res) => {
  try {
    const safety = await storage.getProductSafety(parseInt(req.params.productId));
    res.json(safety);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product safety data" });
  }
});

router.post("/products/:productId/safety", async (req, res) => {
  try {
    const validatedData = insertProductSafetySchema.parse({
      ...req.body,
      productId: parseInt(req.params.productId)
    });
    const safety = await storage.createProductSafety(validatedData);
    res.status(201).json(safety);
  } catch (error) {
    res.status(400).json({ error: "Invalid safety data" });
  }
});

router.put("/products/:productId/safety", async (req, res) => {
  try {
    const safety = await storage.updateProductSafety(parseInt(req.params.productId), req.body);
    if (!safety) {
      return res.status(404).json({ error: "Product safety data not found" });
    }
    res.json(safety);
  } catch (error) {
    res.status(500).json({ error: "Failed to update safety data" });
  }
});

router.delete("/products/:productId/safety", async (req, res) => {
  try {
    const success = await storage.deleteProductSafety(parseInt(req.params.productId));
    if (!success) {
      return res.status(404).json({ error: "Product safety data not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete safety data" });
  }
});

// Quality Control endpoints
router.get("/quality-tests", async (req, res) => {
  try {
    const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
    const tests = await storage.getQualityTests(batchId);
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quality tests" });
  }
});

router.get("/quality-tests/:id", async (req, res) => {
  try {
    const test = await storage.getQualityTest(parseInt(req.params.id));
    if (!test) {
      return res.status(404).json({ error: "Quality test not found" });
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quality test" });
  }
});

router.get("/batches/:batchId/quality-tests", async (req, res) => {
  try {
    const tests = await storage.getQualityTestsByBatch(parseInt(req.params.batchId));
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch batch quality tests" });
  }
});

router.post("/quality-tests", async (req, res) => {
  try {
    const validatedData = insertQualityTestSchema.parse(req.body);
    const test = await storage.createQualityTest(validatedData);
    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ error: "Invalid quality test data" });
  }
});

router.put("/quality-tests/:id", async (req, res) => {
  try {
    const test = await storage.updateQualityTest(parseInt(req.params.id), req.body);
    if (!test) {
      return res.status(404).json({ error: "Quality test not found" });
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: "Failed to update quality test" });
  }
});

router.delete("/quality-tests/:id", async (req, res) => {
  try {
    const success = await storage.deleteQualityTest(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Quality test not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete quality test" });
  }
});

// Production Order endpoints
router.get("/production-orders", async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      productId: req.query.productId ? parseInt(req.query.productId as string) : undefined
    };
    const orders = await storage.getProductionOrders(filters);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch production orders" });
  }
});

router.get("/production-orders/:id", async (req, res) => {
  try {
    const order = await storage.getProductionOrder(parseInt(req.params.id));
    if (!order) {
      return res.status(404).json({ error: "Production order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch production order" });
  }
});

router.get("/production-orders/:id/materials", async (req, res) => {
  try {
    const materials = await storage.getProductionMaterials(parseInt(req.params.id));
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch production materials" });
  }
});

router.post("/production-orders", async (req, res) => {
  try {
    const validatedData = insertProductionOrderSchema.parse(req.body);
    const order = await storage.createProductionOrder(validatedData);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: "Invalid production order data" });
  }
});

router.put("/production-orders/:id", async (req, res) => {
  try {
    const order = await storage.updateProductionOrder(parseInt(req.params.id), req.body);
    if (!order) {
      return res.status(404).json({ error: "Production order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to update production order" });
  }
});

router.delete("/production-orders/:id", async (req, res) => {
  try {
    const success = await storage.deleteProductionOrder(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Production order not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete production order" });
  }
});

// Regulatory Submission endpoints
router.get("/regulatory-submissions", async (req, res) => {
  try {
    const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
    const status = req.query.status as string;
    const submissions = await storage.getRegulatorySubmissions(productId, status);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch regulatory submissions" });
  }
});

router.get("/regulatory-submissions/:id", async (req, res) => {
  try {
    const submission = await storage.getRegulatorySubmission(parseInt(req.params.id));
    if (!submission) {
      return res.status(404).json({ error: "Regulatory submission not found" });
    }
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch regulatory submission" });
  }
});

router.post("/regulatory-submissions", async (req, res) => {
  try {
    const validatedData = insertRegulatorySubmissionSchema.parse(req.body);
    const submission = await storage.createRegulatorySubmission(validatedData);
    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ error: "Invalid regulatory submission data" });
  }
});

router.put("/regulatory-submissions/:id", async (req, res) => {
  try {
    const submission = await storage.updateRegulatorySubmission(parseInt(req.params.id), req.body);
    if (!submission) {
      return res.status(404).json({ error: "Regulatory submission not found" });
    }
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: "Failed to update regulatory submission" });
  }
});

router.delete("/regulatory-submissions/:id", async (req, res) => {
  try {
    const success = await storage.deleteRegulatorySubmission(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Regulatory submission not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete regulatory submission" });
  }
});

// Warehouse Management endpoints
router.get("/warehouses", async (req, res) => {
  try {
    const warehouses = await storage.getWarehouses();
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch warehouses" });
  }
});

router.get("/warehouses/:id", async (req, res) => {
  try {
    const warehouse = await storage.getWarehouse(parseInt(req.params.id));
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch warehouse" });
  }
});

router.get("/warehouse-locations", async (req, res) => {
  try {
    const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string) : undefined;
    const locations = await storage.getWarehouseLocations(warehouseId);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch warehouse locations" });
  }
});

router.post("/warehouses", async (req, res) => {
  try {
    const validatedData = insertWarehouseSchema.parse(req.body);
    const warehouse = await storage.createWarehouse(validatedData);
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(400).json({ error: "Invalid warehouse data" });
  }
});

router.post("/warehouse-locations", async (req, res) => {
  try {
    const validatedData = insertWarehouseLocationSchema.parse(req.body);
    const location = await storage.createWarehouseLocation(validatedData);
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ error: "Invalid location data" });
  }
});

// Financial - Account endpoints
router.get("/accounts", async (req, res) => {
  try {
    const type = req.query.type as string;
    const accounts = await storage.getAccounts(type);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

router.get("/accounts/:id", async (req, res) => {
  try {
    const account = await storage.getAccount(parseInt(req.params.id));
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

router.get("/accounts/code/:code", async (req, res) => {
  try {
    const account = await storage.getAccountByCode(req.params.code);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

router.post("/accounts", async (req, res) => {
  try {
    const validatedData = insertAccountSchema.parse(req.body);
    const account = await storage.createAccount(validatedData);
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ error: "Invalid account data" });
  }
});

router.put("/accounts/:id", async (req, res) => {
  try {
    const account = await storage.updateAccount(parseInt(req.params.id), req.body);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: "Failed to update account" });
  }
});

router.delete("/accounts/:id", async (req, res) => {
  try {
    const success = await storage.deleteAccount(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Journal Entry endpoints
router.get("/journal-entries", async (req, res) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      status: req.query.status as string
    };
    const entries = await storage.getJournalEntries(filters);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
});

router.get("/journal-entries/:id", async (req, res) => {
  try {
    const entry = await storage.getJournalEntry(parseInt(req.params.id));
    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch journal entry" });
  }
});

router.get("/journal-entries/:id/lines", async (req, res) => {
  try {
    const lines = await storage.getJournalLines(parseInt(req.params.id));
    res.json(lines);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch journal lines" });
  }
});

router.post("/journal-entries", async (req, res) => {
  try {
    const validatedData = insertJournalEntrySchema.parse(req.body);
    const entry = await storage.createJournalEntry(validatedData);
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: "Invalid journal entry data" });
  }
});

router.post("/journal-lines", async (req, res) => {
  try {
    const validatedData = insertJournalLineSchema.parse(req.body);
    const line = await storage.createJournalLine(validatedData);
    res.status(201).json(line);
  } catch (error) {
    res.status(400).json({ error: "Invalid journal line data" });
  }
});

// Customer Payment endpoints
router.get("/customer-payments", async (req, res) => {
  try {
    const filters = {
      customerId: req.query.customerId ? parseInt(req.query.customerId as string) : undefined,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string
    };
    const payments = await storage.getCustomerPayments(filters);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customer payments" });
  }
});

router.get("/customer-payments/:id", async (req, res) => {
  try {
    const payment = await storage.getCustomerPayment(parseInt(req.params.id));
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

router.get("/customer-payments/:id/allocations", async (req, res) => {
  try {
    const allocations = await storage.getPaymentAllocations(parseInt(req.params.id));
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment allocations" });
  }
});

router.post("/customer-payments", async (req, res) => {
  try {
    const validatedData = insertCustomerPaymentSchema.parse(req.body);
    const payment = await storage.createCustomerPayment(validatedData);
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: "Invalid payment data" });
  }
});

router.post("/payment-allocations", async (req, res) => {
  try {
    const validatedData = insertPaymentAllocationSchema.parse(req.body);
    const allocation = await storage.createPaymentAllocation(validatedData);
    res.status(201).json(allocation);
  } catch (error) {
    res.status(400).json({ error: "Invalid allocation data" });
  }
});

// Tax Rate endpoints
router.get("/tax-rates", async (req, res) => {
  try {
    const active = req.query.active ? req.query.active === 'true' : undefined;
    const rates = await storage.getTaxRates(active);
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tax rates" });
  }
});

router.post("/tax-rates", async (req, res) => {
  try {
    const validatedData = insertTaxRateSchema.parse(req.body);
    const rate = await storage.createTaxRate(validatedData);
    res.status(201).json(rate);
  } catch (error) {
    res.status(400).json({ error: "Invalid tax rate data" });
  }
});

// Currency endpoints
router.get("/currencies", async (req, res) => {
  try {
    const active = req.query.active ? req.query.active === 'true' : undefined;
    const currencies = await storage.getCurrencies(active);
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch currencies" });
  }
});

router.get("/currencies/base", async (req, res) => {
  try {
    const currency = await storage.getBaseCurrency();
    res.json(currency);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch base currency" });
  }
});

router.post("/currencies", async (req, res) => {
  try {
    const validatedData = insertCurrencySchema.parse(req.body);
    const currency = await storage.createCurrency(validatedData);
    res.status(201).json(currency);
  } catch (error) {
    res.status(400).json({ error: "Invalid currency data" });
  }
});

// Bank Account endpoints
router.get("/bank-accounts", async (req, res) => {
  try {
    const active = req.query.active ? req.query.active === 'true' : undefined;
    const accounts = await storage.getBankAccounts(active);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bank accounts" });
  }
});

router.post("/bank-accounts", async (req, res) => {
  try {
    const validatedData = insertBankAccountSchema.parse(req.body);
    const account = await storage.createBankAccount(validatedData);
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ error: "Invalid bank account data" });
  }
});

// Budget endpoints
router.get("/budgets", async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const budgets = await storage.getBudgets(year);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

router.get("/budgets/:id/categories", async (req, res) => {
  try {
    const categories = await storage.getBudgetCategories(parseInt(req.params.id));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budget categories" });
  }
});

router.post("/budgets", async (req, res) => {
  try {
    const validatedData = insertBudgetSchema.parse(req.body);
    const budget = await storage.createBudget(validatedData);
    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ error: "Invalid budget data" });
  }
});

// Asset endpoints
router.get("/assets", async (req, res) => {
  try {
    const category = req.query.category as string;
    const status = req.query.status as string;
    const assets = await storage.getAssets(category, status);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

router.get("/assets/:id/maintenance", async (req, res) => {
  try {
    const records = await storage.getMaintenanceRecords(parseInt(req.params.id));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch maintenance records" });
  }
});

router.post("/assets", async (req, res) => {
  try {
    const validatedData = insertAssetSchema.parse(req.body);
    const asset = await storage.createAsset(validatedData);
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ error: "Invalid asset data" });
  }
});

// Department endpoints
router.get("/departments", async (req, res) => {
  try {
    const active = req.query.active ? req.query.active === 'true' : undefined;
    const departments = await storage.getDepartments(active);
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

router.post("/departments", async (req, res) => {
  try {
    const validatedData = insertDepartmentSchema.parse(req.body);
    const department = await storage.createDepartment(validatedData);
    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ error: "Invalid department data" });
  }
});

// Employee Profile endpoints
router.get("/employee-profiles", async (req, res) => {
  try {
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
    const profiles = await storage.getEmployeeProfiles(departmentId);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employee profiles" });
  }
});

router.get("/employee-profiles/user/:userId", async (req, res) => {
  try {
    const profile = await storage.getEmployeeByUserId(parseInt(req.params.userId));
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employee profile" });
  }
});

router.post("/employee-profiles", async (req, res) => {
  try {
    const validatedData = insertEmployeeProfileSchema.parse(req.body);
    const profile = await storage.createEmployeeProfile(validatedData);
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: "Invalid employee profile data" });
  }
});

// Document endpoints
router.get("/documents", async (req, res) => {
  try {
    const entityType = req.query.entityType as string;
    const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;
    const documents = await storage.getDocuments(entityType, entityId);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.get("/document-types", async (req, res) => {
  try {
    const types = await storage.getDocumentTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch document types" });
  }
});

router.post("/documents", async (req, res) => {
  try {
    const validatedData = insertDocumentSchema.parse(req.body);
    const document = await storage.createDocument(validatedData);
    res.status(201).json(document);
  } catch (error) {
    res.status(400).json({ error: "Invalid document data" });
  }
});

// Notification endpoints
router.get("/notifications/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await storage.getNotifications(userId, unreadOnly);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.get("/notification-templates", async (req, res) => {
  try {
    const templates = await storage.getNotificationTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notification templates" });
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const validatedData = insertNotificationSchema.parse(req.body);
    const notification = await storage.createNotification(validatedData);
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: "Invalid notification data" });
  }
});

router.put("/notifications/:id/read", async (req, res) => {
  try {
    const success = await storage.markNotificationAsRead(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

export default router;