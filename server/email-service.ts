// EMAIL NOTIFICATION SERVICE
// Handles all email communications for the ERP system

import nodemailer from 'nodemailer';
import { db } from './db';
import { emailQueue } from '@shared/schema';

// Email transporter configuration
let transporter: nodemailer.Transporter | null = null;

export function initializeEmailService() {
  // Use SendGrid if available, otherwise use SMTP
  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    console.log('⚠️ Email service not configured. Emails will be logged only.');
  }
}

// Queue an email for sending
export async function queueEmail(to: string, subject: string, body: string) {
  try {
    await db.insert(emailQueue).values({
      toEmail: to,
      subject,
      body,
      status: 'pending',
      attempts: 0
    });
    
    // Try to send immediately
    processEmailQueue();
  } catch (error) {
    console.error('Error queueing email:', error);
  }
}

// Process pending emails
export async function processEmailQueue() {
  try {
    const pendingEmails = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.status, 'pending'))
      .limit(10);

    for (const email of pendingEmails) {
      await sendEmail(email);
    }
  } catch (error) {
    console.error('Error processing email queue:', error);
  }
}

// Send individual email
async function sendEmail(emailRecord: any) {
  try {
    if (!transporter) {
      console.log(`📧 Email to ${emailRecord.toEmail}: ${emailRecord.subject}`);
      console.log(`Body: ${emailRecord.body.substring(0, 100)}...`);
      
      // Mark as sent in development
      await db.update(emailQueue)
        .set({ 
          status: 'sent',
          sentAt: new Date()
        })
        .where(eq(emailQueue.id, emailRecord.id));
      return;
    }

    // Send actual email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@premiererp.com',
      to: emailRecord.toEmail,
      subject: emailRecord.subject,
      html: emailRecord.body
    });

    // Mark as sent
    await db.update(emailQueue)
      .set({ 
        status: 'sent',
        sentAt: new Date()
      })
      .where(eq(emailQueue.id, emailRecord.id));
      
    console.log(`✅ Email sent to ${emailRecord.toEmail}`);
  } catch (error) {
    console.error(`Failed to send email to ${emailRecord.toEmail}:`, error);
    
    // Update attempt count
    await db.update(emailQueue)
      .set({ 
        attempts: emailRecord.attempts + 1,
        errorMessage: error.message,
        status: emailRecord.attempts >= 3 ? 'failed' : 'pending'
      })
      .where(eq(emailQueue.id, emailRecord.id));
  }
}

// Email templates
export const emailTemplates = {
  invoiceCreated: (invoice: any, customer: any) => ({
    subject: `Invoice ${invoice.invoiceNumber} - Premier ERP`,
    body: `
      <h2>Invoice ${invoice.invoiceNumber}</h2>
      <p>Dear ${customer.name},</p>
      <p>Please find attached your invoice for ${invoice.totalAmount}.</p>
      <p>Due Date: ${invoice.dueDate}</p>
      <p>Thank you for your business!</p>
      <hr>
      <p>Premier ERP System</p>
    `
  }),
  
  paymentReceived: (payment: any, customer: any) => ({
    subject: `Payment Received - ${payment.paymentNumber}`,
    body: `
      <h2>Payment Confirmation</h2>
      <p>Dear ${customer.name},</p>
      <p>We have received your payment of ${payment.amount}.</p>
      <p>Payment Reference: ${payment.reference}</p>
      <p>Thank you!</p>
      <hr>
      <p>Premier ERP System</p>
    `
  }),
  
  lowStockAlert: (product: any) => ({
    subject: `Low Stock Alert - ${product.name}`,
    body: `
      <h2>Low Stock Alert</h2>
      <p>The following product is running low on stock:</p>
      <ul>
        <li>Product: ${product.name}</li>
        <li>Current Stock: ${product.quantity} ${product.unitOfMeasure}</li>
        <li>Threshold: ${product.lowStockThreshold}</li>
      </ul>
      <p>Please reorder soon.</p>
      <hr>
      <p>Premier ERP System</p>
    `
  }),
  
  expiryAlert: (product: any) => ({
    subject: `Product Expiry Alert - ${product.name}`,
    body: `
      <h2>Product Expiry Warning</h2>
      <p>The following product is expiring soon:</p>
      <ul>
        <li>Product: ${product.name}</li>
        <li>Expiry Date: ${product.expiryDate}</li>
        <li>Current Stock: ${product.quantity} ${product.unitOfMeasure}</li>
      </ul>
      <p>Please take necessary action.</p>
      <hr>
      <p>Premier ERP System</p>
    `
  })
};

// Schedule email queue processing
let emailInterval: NodeJS.Timeout | null = null;
export function startEmailScheduler() {
  // Clear existing interval if any
  if (emailInterval) {
    clearInterval(emailInterval);
  }
  
  // Process email queue every 5 minutes instead of every minute
  emailInterval = setInterval(() => {
    processEmailQueue();
  }, 300000); // 5 minutes
  
  console.log('✅ Email service initialized');
}

// Cleanup function
export function stopEmailScheduler() {
  if (emailInterval) {
    clearInterval(emailInterval);
    emailInterval = null;
  }
}

// Initialize on module load
initializeEmailService();

import { eq } from 'drizzle-orm';