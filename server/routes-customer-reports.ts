import { Router, Request, Response } from "express";
import { sql, count, desc, eq, gte, lte, and } from "drizzle-orm";
import { db } from "./db";
import { customers, sales, orders } from "../shared/schema.js";

const router = Router();

// GET /api/v1/reports/customers - Get comprehensive customer analytics
router.get("/", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filters if provided
    const dateFilter = startDate && endDate 
      ? and(
          gte(sales.date, new Date(startDate as string)),
          lte(sales.date, new Date(endDate as string))
        )
      : undefined;

    // ============= Basic Metrics =============
    
    // Total customers count
    const totalCustomersResult = await db.select({ count: count() }).from(customers);
    const totalCustomers = totalCustomersResult[0].count;

    // Active customers (with sales in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const activeCustomersResult = await db
      .selectDistinct({ customerId: sales.customerId })
      .from(sales)
      .where(gte(sales.date, ninetyDaysAgo));
    const activeCustomers = activeCustomersResult.length;

    // New customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newCustomersResult = await db.select({ count: count() })
      .from(customers)
      .where(gte(customers.createdAt, startOfMonth));
    const newCustomersThisMonth = newCustomersResult[0].count;

    // ============= Revenue Metrics =============
    
    // Total revenue from all customers
    const totalRevenueResult = await db.select({
      totalRevenue: sql`COALESCE(SUM(CAST(${sales.grandTotal} AS DECIMAL)), 0)`
    }).from(sales).where(dateFilter);
    const totalRevenue = totalRevenueResult[0].totalRevenue || 0;

    // Average order value
    const avgOrderValueResult = await db.select({
      avgOrderValue: sql`COALESCE(AVG(CAST(${sales.grandTotal} AS DECIMAL)), 0)`
    }).from(sales).where(dateFilter);
    const averageOrderValue = avgOrderValueResult[0].avgOrderValue || 0;

    // ============= Sector Distribution =============
    
    const sectorDistributionResult = await db.select({
      sector: customers.sector,
      count: count()
    })
    .from(customers)
    .groupBy(customers.sector)
    .orderBy(desc(count()));

    const sectorDistribution = sectorDistributionResult.reduce((acc, row) => {
      acc[row.sector || 'Unknown'] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // ============= Geographic Distribution =============
    
    const geographicDistributionResult = await db.select({
      city: customers.city,
      state: customers.state,
      count: count()
    })
    .from(customers)
    .where(sql`${customers.city} IS NOT NULL OR ${customers.state} IS NOT NULL`)
    .groupBy(customers.city, customers.state)
    .orderBy(desc(count()));

    const geographic = geographicDistributionResult.reduce((acc, row) => {
      const location = [row.city, row.state].filter(Boolean).join(', ') || 'Unknown';
      acc[location] = (acc[location] || 0) + row.count;
      return acc;
    }, {} as Record<string, number>);

    // ============= Top Customers by Revenue =============
    
    const topCustomersResult = await db.select({
      customerId: sales.customerId,
      customerName: customers.name,
      totalRevenue: sql`COALESCE(SUM(CAST(${sales.grandTotal} AS DECIMAL)), 0)`,
      totalOrders: count(sales.id)
    })
    .from(sales)
    .innerJoin(customers, eq(sales.customerId, customers.id))
    .where(dateFilter)
    .groupBy(sales.customerId, customers.name)
    .orderBy(desc(sql`SUM(CAST(${sales.grandTotal} AS DECIMAL))`))
    .limit(10);

    // ============= Monthly Growth Trend =============
    
    const monthlyGrowthResult = await db.select({
      month: sql`TO_CHAR(${customers.createdAt}, 'YYYY-MM')`,
      newCustomers: count()
    })
    .from(customers)
    .where(gte(customers.createdAt, sql`CURRENT_DATE - INTERVAL '12 months'`))
    .groupBy(sql`TO_CHAR(${customers.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${customers.createdAt}, 'YYYY-MM')`);

    // Calculate growth percentages
    const monthlyGrowth = monthlyGrowthResult.map((month, index) => {
      const previousMonth = monthlyGrowthResult[index - 1];
      const growthPercent = previousMonth 
        ? ((month.newCustomers - previousMonth.newCustomers) / previousMonth.newCustomers * 100).toFixed(1)
        : '0';
      
      return {
        month: month.month,
        newCustomers: month.newCustomers,
        growth: parseFloat(growthPercent)
      };
    });

    // ============= Repeat Customer Rate =============
    
    const repeatCustomersResult = await db.select({
      customerId: sales.customerId,
      orderCount: count()
    })
    .from(sales)
    .groupBy(sales.customerId)
    .having(sql`COUNT(*) > 1`);

    const repeatCustomersCount = repeatCustomersResult.length;
    const repeatCustomersRate = totalCustomers > 0 
      ? ((repeatCustomersCount / totalCustomers) * 100).toFixed(1) + '%'
      : '0%';

    // ============= Customer Lifetime Value =============
    
    const customerLifetimeValueResult = await db.select({
      avgLifetimeValue: sql`COALESCE(AVG(customer_totals.total_spent), 0)`
    })
    .from(
      db.select({
        customerId: sales.customerId,
        totalSpent: sql`SUM(CAST(${sales.grandTotal} AS DECIMAL))`.as('total_spent')
      })
      .from(sales)
      .groupBy(sales.customerId)
      .as('customer_totals')
    );

    const averageLifetimeValue = customerLifetimeValueResult[0].avgLifetimeValue || 0;

    // ============= Response =============
    
    const report = {
      summary: {
        totalCustomers,
        activeCustomers,
        newCustomersThisMonth,
        totalRevenue: totalRevenue.toString(),
        averageOrderValue: parseFloat(String(averageOrderValue)).toFixed(2),
        repeatCustomers: repeatCustomersRate,
        averageLifetimeValue: parseFloat(String(averageLifetimeValue)).toFixed(2)
      },
      sectorDistribution,
      geographic,
      topCustomers: topCustomersResult.map(customer => ({
        id: customer.customerId,
        name: customer.customerName,
        revenue: String(customer.totalRevenue),
        orderCount: customer.totalOrders
      })),
      monthlyGrowth,
      metrics: {
        customerRetentionRate: repeatCustomersRate,
        customerAcquisitionTrend: monthlyGrowth.slice(-3), // Last 3 months
        revenueGrowth: monthlyGrowth.length > 1 
          ? ((monthlyGrowth[monthlyGrowth.length - 1].newCustomers - monthlyGrowth[0].newCustomers) / monthlyGrowth[0].newCustomers * 100).toFixed(1) + '%'
          : '0%'
      }
    };

    res.json(report);
  } catch (error) {
    console.error("Error generating customer reports:", error);
    res.status(500).json({ message: "Failed to generate customer reports" });
  }
});

// GET /api/v1/reports/customers/sectors - Get detailed sector analysis
router.get("/sectors", async (req: Request, res: Response) => {
  try {
    const sectorAnalysis = await db.select({
      sector: customers.sector,
      customerCount: count(customers.id),
      totalRevenue: sql`COALESCE(SUM(CAST(${sales.grandTotal} AS DECIMAL)), 0)`,
      avgRevenuePerCustomer: sql`COALESCE(AVG(CAST(${sales.grandTotal} AS DECIMAL)), 0)`,
      lastActivityDate: sql`MAX(${sales.date})`
    })
    .from(customers)
    .leftJoin(sales, eq(customers.id, sales.customerId))
    .groupBy(customers.sector)
    .orderBy(desc(count(customers.id)));

    res.json(sectorAnalysis);
  } catch (error) {
    console.error("Error generating sector analysis:", error);
    res.status(500).json({ message: "Failed to generate sector analysis" });
  }
});

// GET /api/v1/reports/customers/geographic - Get detailed geographic analysis  
router.get("/geographic", async (req: Request, res: Response) => {
  try {
    const geographicAnalysis = await db.select({
      city: customers.city,
      state: customers.state,
      customerCount: count(customers.id),
      totalRevenue: sql`COALESCE(SUM(CAST(${sales.grandTotal} AS DECIMAL)), 0)`,
      avgRevenuePerCustomer: sql`COALESCE(AVG(CAST(${sales.grandTotal} AS DECIMAL)), 0)`
    })
    .from(customers)
    .leftJoin(sales, eq(customers.id, sales.customerId))
    .where(sql`${customers.city} IS NOT NULL OR ${customers.state} IS NOT NULL`)
    .groupBy(customers.city, customers.state)
    .orderBy(desc(count(customers.id)));

    res.json(geographicAnalysis);
  } catch (error) {
    console.error("Error generating geographic analysis:", error);
    res.status(500).json({ message: "Failed to generate geographic analysis" });
  }
});

export default router;