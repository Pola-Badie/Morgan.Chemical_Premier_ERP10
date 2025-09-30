import { Router } from "express";
import customersRouter from "./routes-customers.js";
import customerReportsRouter from "./routes-customer-reports.js";
import bulkRouter from "./routes-bulk.js";

const router = Router();

// Mount v1 API routes
router.use("/customers", customersRouter);
router.use("/reports/customers", customerReportsRouter);
router.use("/bulk", bulkRouter);

export default router;