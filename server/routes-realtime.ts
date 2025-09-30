
import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import { db } from './db';
import { eq, desc, sql } from 'drizzle-orm';
import { products as inventory, orders, customers, invoices } from '@shared/schema';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Configure email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Advanced Reports API
router.get('/reports/advanced', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, warehouse } = req.query;
    
    // Mock data for demonstration
    const reportData = {
      salesTrend: [
        { date: '2024-01-01', sales: 12000, orders: 45, revenue: 15000 },
        { date: '2024-01-02', sales: 13500, orders: 52, revenue: 16800 },
        { date: '2024-01-03', sales: 11200, orders: 38, revenue: 14200 },
        { date: '2024-01-04', sales: 14800, orders: 61, revenue: 18400 },
        { date: '2024-01-05', sales: 16200, orders: 67, revenue: 20100 }
      ],
      inventoryAnalysis: [
        { category: 'Raw Materials', value: 45000, quantity: 1200, percentage: 35 },
        { category: 'Finished Products', value: 38000, quantity: 800, percentage: 30 },
        { category: 'Packaging', value: 22000, quantity: 2000, percentage: 20 },
        { category: 'Chemicals', value: 19000, quantity: 500, percentage: 15 }
      ],
      customerMetrics: [
        { customer: 'Advanced Pharmaceuticals', totalOrders: 45, totalValue: 125000, lastOrder: '2024-01-05' },
        { customer: 'BioTech Innovations', totalOrders: 38, totalValue: 98000, lastOrder: '2024-01-04' },
        { customer: 'PureChem Industries', totalOrders: 52, totalValue: 145000, lastOrder: '2024-01-05' }
      ],
      financialSummary: {
        totalRevenue: 345000,
        totalExpenses: 234000,
        grossProfit: 111000,
        netProfit: 89000,
        profitMargin: 25.8
      }
    };

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate advanced report' });
  }
});

// Bulk Import API
router.post('/bulk-import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const type = req.body.type;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    });

    const results: any[] = [];
    let processed = 0;
    let total = 0;

    // Count total rows first
    fs.createReadStream(file.path)
      .pipe(csvParser())
      .on('data', () => total++)
      .on('end', () => {
        // Process the file
        fs.createReadStream(file.path)
          .pipe(csvParser())
          .on('data', (data) => {
            processed++;
            results.push(data);
            
            // Send progress update
            const progress = Math.round((processed / total) * 100);
            res.write(JSON.stringify({ progress }) + '\n');
          })
          .on('end', () => {
            // Send final result
            const importResult = {
              success: true,
              imported: results.length,
              failed: 0,
              errors: []
            };
            
            res.write(JSON.stringify({ result: importResult }) + '\n');
            res.end();
            
            // Clean up uploaded file
            fs.unlinkSync(file.path);
          });
      });

  } catch (error) {
    res.status(500).json({ error: 'Import failed' });
  }
});

// Bulk Export API
router.get('/bulk-export', async (req: Request, res: Response) => {
  try {
    const { type, format } = req.query;
    
    // Mock data for demonstration
    const mockData = [
      { id: 1, name: 'Product A', category: 'Chemical', price: 99.99, stock: 50 },
      { id: 2, name: 'Product B', category: 'Pharmaceutical', price: 149.99, stock: 25 },
      { id: 3, name: 'Product C', category: 'Raw Material', price: 49.99, stock: 100 }
    ];

    if (format === 'csv') {
      const csvWriter = createObjectCsvWriter({
        path: 'temp/export.csv',
        header: [
          { id: 'id', title: 'ID' },
          { id: 'name', title: 'Name' },
          { id: 'category', title: 'Category' },
          { id: 'price', title: 'Price' },
          { id: 'stock', title: 'Stock' }
        ]
      });

      await csvWriter.writeRecords(mockData);
      res.download('temp/export.csv', `${type}_export.csv`);
    } else {
      // For Excel export, you would use a library like xlsx
      res.json(mockData);
    }
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// Email Notification APIs
router.get('/notifications/templates', async (req: Request, res: Response) => {
  const templates = [
    {
      id: 'low-stock-alert',
      name: 'Low Stock Alert',
      subject: 'Low Stock Alert - {{productName}}',
      content: 'Product {{productName}} is running low with only {{quantity}} units remaining.',
      type: 'alert',
      variables: ['productName', 'quantity']
    },
    {
      id: 'expiry-warning',
      name: 'Product Expiry Warning',
      subject: 'Product Expiry Alert - {{productName}}',
      content: 'Product {{productName}} will expire on {{expiryDate}}.',
      type: 'alert',
      variables: ['productName', 'expiryDate']
    },
    {
      id: 'order-confirmation',
      name: 'Order Confirmation',
      subject: 'Order Confirmation - {{orderNumber}}',
      content: 'Your order {{orderNumber}} has been confirmed for {{customerName}}.',
      type: 'notification',
      variables: ['orderNumber', 'customerName']
    }
  ];

  res.json(templates);
});

router.post('/notifications/test', async (req: Request, res: Response) => {
  try {
    const { email, templateId } = req.body;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Test Email from Premier ERP',
      html: '<p>This is a test email from your Premier ERP system.</p>'
    };

    const transporter = createEmailTransporter();
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

router.get('/notifications/history', async (req: Request, res: Response) => {
  const mockHistory = [
    {
      id: 1,
      subject: 'Low Stock Alert - Aspirin',
      recipient: 'admin@company.com',
      status: 'sent',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      subject: 'Product Expiry Warning - Ibuprofen',
      recipient: 'manager@company.com',
      status: 'sent',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  res.json(mockHistory);
});

// WebSocket for real-time updates
export function setupWebSocket(server: any) {
  const wss = new WebSocket.Server({ server, path: '/ws/dashboard' });

  wss.on('connection', (ws) => {
    console.log('Client connected to dashboard WebSocket');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          // Fetch REAL dashboard data from database
          const fetchRealDashboardData = async () => {
            try {
              // Get total products count
              const productCount = await db.select({ count: sql`count(*)::int` })
                .from(inventory);
              
              // Get low stock count (quantity < 20)
              const lowStock = await db.select({ count: sql`count(*)::int` })
                .from(inventory)
                .where(sql`quantity < 20`);
              
              // Get expiring products count (within 30 days)
              const expiringDate = new Date();
              expiringDate.setDate(expiringDate.getDate() + 30);
              const expiring = await db.select({ count: sql`count(*)::int` })
                .from(inventory)
                .where(sql`expiry_date <= ${expiringDate.toISOString()}::date AND expiry_date >= CURRENT_DATE`);
              
              // Get total orders count
              const orderCount = await db.select({ count: sql`count(*)::int` })
                .from(orders);
              
              // Get total revenue from invoices
              const revenue = await db.select({ 
                total: sql`COALESCE(SUM(total_amount), 0)::numeric` 
              }).from(invoices);
              
              // Get recent activities (last 5 orders)
              const recentOrders = await db.select({
                id: orders.id,
                customerName: customers.name,
                createdAt: orders.createdAt
              })
              .from(orders)
              .leftJoin(customers, eq(orders.customerId, customers.id))
              .orderBy(desc(orders.createdAt))
              .limit(5);
              
              const activities = recentOrders.map((order, index) => ({
                id: String(order.id),
                type: 'order',
                message: `New order from ${order.customerName || 'Customer'}`,
                timestamp: order.createdAt?.toISOString() || new Date().toISOString(),
                severity: 'low' as const
              }));
              
              // Send real data
              ws.send(JSON.stringify({
                type: 'dashboard_update',
                data: {
                  totalProducts: productCount[0]?.count || 0,
                  lowStockCount: lowStock[0]?.count || 0,
                  expiringCount: expiring[0]?.count || 0,
                  totalOrders: orderCount[0]?.count || 0,
                  totalRevenue: Number(revenue[0]?.total) || 0,
                  systemHealth: 'healthy',
                  lastUpdated: new Date().toISOString(),
                  recentActivities: activities
                }
              }));
              
              console.log('WebSocket: Sent real dashboard data to client');
            } catch (error) {
              console.error('WebSocket: Error fetching dashboard data:', error);
              // Send error state
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to fetch dashboard data'
              }));
            }
          };
          
          // Send real data
          fetchRealDashboardData();
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from dashboard WebSocket');
    });
  });

  // Disable real-time updates to save memory
  // Only send updates when specifically requested
  let updateInterval: NodeJS.Timeout | null = null;
  
  // Cleanup on server shutdown
  process.on('SIGINT', () => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
}

export default router;
