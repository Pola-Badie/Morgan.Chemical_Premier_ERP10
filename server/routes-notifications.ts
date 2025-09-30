
import express from 'express';
import nodemailer from 'nodemailer';
import { db } from './db';
import { users, products, customers } from '../shared/schema';
import { lte, gte } from 'drizzle-orm';

const router = express.Router();

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const EMAIL_TEMPLATES = {
  lowStock: {
    subject: 'Low Stock Alert - {{productName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Low Stock Alert</h2>
        <p>The following product is running low on stock:</p>
        <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0;">
          <h3>{{productName}}</h3>
          <p><strong>SKU:</strong> {{sku}}</p>
          <p><strong>Current Stock:</strong> {{currentStock}}</p>
          <p><strong>Minimum Level:</strong> {{minLevel}}</p>
          <p><strong>Warehouse:</strong> {{warehouse}}</p>
        </div>
        <p>Please reorder this product to maintain adequate inventory levels.</p>
      </div>
    `
  },
  expiry: {
    subject: 'Product Expiry Alert - {{productName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Product Expiry Alert</h2>
        <p>The following product is expiring soon:</p>
        <div style="background: #fffbeb; padding: 15px; border-left: 4px solid #d97706; margin: 15px 0;">
          <h3>{{productName}}</h3>
          <p><strong>SKU:</strong> {{sku}}</p>
          <p><strong>Expiry Date:</strong> {{expiryDate}}</p>
          <p><strong>Days Until Expiry:</strong> {{daysUntilExpiry}}</p>
          <p><strong>Current Stock:</strong> {{currentStock}}</p>
        </div>
        <p>Please take appropriate action before the expiry date.</p>
      </div>
    `
  },
  orderUpdate: {
    subject: 'Order Update - Order #{{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Order Update</h2>
        <p>Your order status has been updated:</p>
        <div style="background: #ecfdf5; padding: 15px; border-left: 4px solid #059669; margin: 15px 0;">
          <h3>Order #{{orderNumber}}</h3>
          <p><strong>Status:</strong> {{status}}</p>
          <p><strong>Customer:</strong> {{customerName}}</p>
          <p><strong>Total Amount:</strong> \${{totalAmount}}</p>
          <p><strong>Updated:</strong> {{updateDate}}</p>
        </div>
        <p>Thank you for your business!</p>
      </div>
    `
  }
};

// Get notification settings
router.get('/notifications/settings', async (req, res) => {
  try {
    // For now, return default settings. In production, store in database
    const settings = {
      lowStockAlert: true,
      expiryAlert: true,
      orderUpdates: true,
      invoiceReminders: true,
      systemUpdates: false,
      emailFrequency: 'immediate',
      recipients: ['admin@company.com']
    };

    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Save notification settings
router.post('/notifications/settings', async (req, res) => {
  try {
    const settings = req.body;
    // In production, save to database
    // For now, just return success
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Get email templates
router.get('/notifications/templates', async (req, res) => {
  try {
    const templates = Object.keys(EMAIL_TEMPLATES).map(key => ({
      id: key,
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      subject: EMAIL_TEMPLATES[key as keyof typeof EMAIL_TEMPLATES].subject,
      type: 'alert',
      variables: extractVariables(EMAIL_TEMPLATES[key as keyof typeof EMAIL_TEMPLATES].html)
    }));

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Send test email
router.post('/notifications/test', async (req, res) => {
  try {
    const { email, templateId } = req.body;

    if (!email || !templateId) {
      return res.status(400).json({ error: 'Email and template ID required' });
    }

    const template = EMAIL_TEMPLATES[templateId as keyof typeof EMAIL_TEMPLATES];
    if (!template) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const transporter = createTransporter();

    // Use sample data for test
    const sampleData = {
      productName: 'Sample Product',
      sku: 'SP001',
      currentStock: '5',
      minLevel: '10',
      warehouse: 'Main Warehouse',
      expiryDate: '2025-01-15',
      daysUntilExpiry: '30',
      orderNumber: 'ORD001',
      status: 'Processing',
      customerName: 'John Doe',
      totalAmount: '150.00',
      updateDate: new Date().toLocaleDateString()
    };

    const subject = replaceVariables(template.subject, sampleData);
    const html = replaceVariables(template.html, sampleData);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@premier-erp.com',
      to: email,
      subject: `[TEST] ${subject}`,
      html
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Send bulk notification
router.post('/notifications/bulk', async (req, res) => {
  try {
    const { templateId, recipients } = req.body;

    if (!templateId || !recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Template ID and recipients required' });
    }

    const template = EMAIL_TEMPLATES[templateId as keyof typeof EMAIL_TEMPLATES];
    if (!template) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const transporter = createTransporter();

    // Send to all recipients
    for (const recipient of recipients) {
      const sampleData = {
        productName: 'Bulk Notification',
        sku: 'BULK001',
        currentStock: '0',
        minLevel: '10',
        warehouse: 'All Warehouses',
        expiryDate: new Date().toLocaleDateString(),
        daysUntilExpiry: '0',
        orderNumber: 'BULK001',
        status: 'Notification',
        customerName: 'All Customers',
        totalAmount: '0.00',
        updateDate: new Date().toLocaleDateString()
      };

      const subject = replaceVariables(template.subject, sampleData);
      const html = replaceVariables(template.html, sampleData);

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@premier-erp.com',
        to: recipient,
        subject,
        html
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({ error: 'Failed to send bulk notification' });
  }
});

// Get notification history
router.get('/notifications/history', async (req, res) => {
  try {
    // Mock data for demo - in production, store in database
    const history = [
      {
        id: '1',
        subject: 'Low Stock Alert - Aspirin',
        recipient: 'admin@company.com',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'sent'
      },
      {
        id: '2',
        subject: 'Product Expiry Alert - Vitamin C',
        recipient: 'admin@company.com',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'sent'
      },
      {
        id: '3',
        subject: 'Order Update - Order #ORD001',
        recipient: 'customer@example.com',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        status: 'failed'
      }
    ];

    res.json(history);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

// Automated alerts
router.post('/notifications/check-alerts', async (req, res) => {
  try {
    const transporter = createTransporter();
    const alerts = [];

    // Check for low stock
    const lowStockProducts = await db
      .select()
      .from(products)
      .where(lte(products.quantity, products.lowStockThreshold));

    for (const product of lowStockProducts) {
      const subject = replaceVariables(EMAIL_TEMPLATES.lowStock.subject, product);
      const html = replaceVariables(EMAIL_TEMPLATES.lowStock.html, product);

      alerts.push({
        type: 'lowStock',
        product: product.name,
        subject,
        html
      });
    }

    // Check for expiring products
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiringProducts = await db
      .select()
      .from(products)
      .where(lte(products.expiryDate, thirtyDaysFromNow)); // 30 days

    for (const product of expiringProducts) {
      const daysUntilExpiry = Math.ceil(
        (new Date(product.expiryDate || '').getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      const data = {
        ...product,
        daysUntilExpiry: daysUntilExpiry.toString(),
        expiryDate: new Date(product.expiryDate || '').toLocaleDateString()
      };

      const subject = replaceVariables(EMAIL_TEMPLATES.expiry.subject, data);
      const html = replaceVariables(EMAIL_TEMPLATES.expiry.html, data);

      alerts.push({
        type: 'expiry',
        product: product.name,
        subject,
        html
      });
    }

    res.json({ alerts: alerts.length, processed: alerts.length });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({ error: 'Failed to check alerts' });
  }
});

function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))];
}

function replaceVariables(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

export default router;
