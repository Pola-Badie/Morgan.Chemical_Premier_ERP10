import { Request, Response } from 'express';
import { db } from './db';
import { sql } from 'drizzle-orm';

export function registerChartDataRoutes(app: any) {
  // ============= REAL CHART DATA ENDPOINTS =============
  // Replace hardcoded dashboard charts with actual database data
  
  // Monthly Sales Data - Real database query
  app.get("/api/dashboard/monthly-sales", async (req: Request, res: Response) => {
    try {
      console.log('📊 MONTHLY SALES: Fetching real monthly sales data from database');
      
      // Get current year monthly sales from database
      const currentYear = new Date().getFullYear();
      const monthlyData: { [key: string]: number } = {};
      
      // Initialize all months to 0
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(month => monthlyData[month] = 0);
      
      // Get real sales data from database using Drizzle sql template
      const salesResult = await db.execute(sql`
        SELECT 
          EXTRACT(MONTH FROM date) as month,
          COALESCE(SUM(CAST(grand_total AS NUMERIC)), 0) as total_sales
        FROM sales 
        WHERE EXTRACT(YEAR FROM date)::int = ${currentYear}
          AND payment_status != 'cancelled'
        GROUP BY EXTRACT(MONTH FROM date)
        ORDER BY month
      `);

      // Map database results to month names
      if (salesResult.rows && salesResult.rows.length > 0) {
        salesResult.rows.forEach((row: any) => {
          const monthIndex = parseInt(row.month) - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            monthlyData[months[monthIndex]] = parseFloat(row.total_sales) / 1000; // Convert to thousands for chart display
          }
        });
      }

      // Convert to array format for chart
      const chartData = months.map(month => ({
        name: month,
        sales: Math.round(monthlyData[month] * 100) / 100 // Round to 2 decimal places
      }));

      console.log(`📊 MONTHLY SALES: Returning real data for ${currentYear}:`, chartData);
      res.json(chartData);
      
    } catch (error) {
      console.error("Error fetching monthly sales data:", error);
      res.status(500).json({ error: "Failed to fetch monthly sales data" });
    }
  });

  // Sales Distribution by Category - Real database query
  app.get("/api/dashboard/sales-distribution", async (req: Request, res: Response) => {
    try {
      console.log('📊 SALES DISTRIBUTION: Fetching real category distribution from database');
      
      // Get sales by product category from database using correct table name
      const distributionResult = await db.execute(sql`
        SELECT 
          COALESCE(c.name, 'Other') as category_name,
          COALESCE(SUM(CAST(si.total AS NUMERIC)), 0) as category_total
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        LEFT JOIN product_categories c ON p.category_id = c.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.payment_status != 'cancelled'
        GROUP BY c.name
        HAVING SUM(CAST(si.total AS NUMERIC)) > 0
        ORDER BY category_total DESC
        LIMIT 6
      `);

      let distributionData: { name: string; value: number; color: string; }[] = [];
      const colors = ['#1D3E78', '#3BCEAC', '#0077B6', '#48CAE4', '#90E0EF', '#CAF0F8'];
      
      if (distributionResult.rows && distributionResult.rows.length > 0) {
        const totalSales = distributionResult.rows.reduce((sum: number, row: any) => sum + parseFloat(row.category_total), 0);
        
        distributionData = distributionResult.rows.map((row: any, index: number) => ({
          name: row.category_name || 'Other',
          value: Math.round((parseFloat(row.category_total) / totalSales) * 1000) / 10, // Percentage with 1 decimal
          color: colors[index % colors.length]
        }));
      } else {
        // Fallback if no data
        distributionData = [{ name: 'No Data', value: 100, color: '#CAF0F8' }];
      }

      console.log('📊 SALES DISTRIBUTION: Real data:', distributionData);
      res.json(distributionData);
      
    } catch (error) {
      console.error("Error fetching sales distribution:", error);
      res.status(500).json({ error: "Failed to fetch sales distribution" });
    }
  });

  // Category Performance - Real database query
  app.get("/api/dashboard/category-performance", async (req: Request, res: Response) => {
    try {
      console.log('📊 CATEGORY PERFORMANCE: Fetching real category performance from database');
      
      // Get category performance based on profit margins and sales volume using correct table name
      const performanceResult = await db.execute(sql`
        SELECT 
          COALESCE(c.name, 'Other') as category_name,
          COUNT(DISTINCT p.id) as product_count,
          COALESCE(SUM(CAST(si.quantity AS NUMERIC)), 0) as total_quantity_sold,
          COALESCE(SUM(CAST(si.total AS NUMERIC)), 0) as total_revenue,
          COALESCE(AVG(CAST(p.selling_price AS NUMERIC) - CAST(p.cost_price AS NUMERIC)), 0) as avg_profit_margin
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        LEFT JOIN product_categories c ON p.category_id = c.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.payment_status != 'cancelled'
          AND CAST(p.selling_price AS NUMERIC) > 0
          AND CAST(p.cost_price AS NUMERIC) > 0
        GROUP BY c.name
        HAVING SUM(CAST(si.total AS NUMERIC)) > 0
        ORDER BY total_revenue DESC
        LIMIT 6
      `);

      let performanceData: { name: string; value: number; color: string; }[] = [];
      const colors = ['#3BCEAC', '#0077B6', '#48CAE4', '#90E0EF', '#CAF0F8', '#1D3E78'];
      
      if (performanceResult.rows && performanceResult.rows.length > 0) {
        const maxRevenue = Math.max(...performanceResult.rows.map((row: any) => parseFloat(row.total_revenue)));
        
        performanceData = performanceResult.rows.map((row: any, index: number) => ({
          name: row.category_name || 'Other',
          value: Math.round((parseFloat(row.total_revenue) / maxRevenue) * 1000) / 10, // Performance score 0-100
          color: colors[index % colors.length]
        }));
      } else {
        // Fallback if no data
        performanceData = [{ name: 'No Data', value: 100, color: '#CAF0F8' }];
      }

      console.log('📊 CATEGORY PERFORMANCE: Real data:', performanceData);
      res.json(performanceData);
      
    } catch (error) {
      console.error("Error fetching category performance:", error);
      res.status(500).json({ error: "Failed to fetch category performance" });
    }
  });
}