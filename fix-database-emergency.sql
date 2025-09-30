-- EMERGENCY DATABASE FIX SCRIPT
-- Fixes all missing tables and columns for production readiness

-- Create journal_entry_lines table if it doesn't exist
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id SERIAL PRIMARY KEY,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  description TEXT,
  debit NUMERIC(10, 2) DEFAULT 0,
  credit NUMERIC(10, 2) DEFAULT 0
);

-- Add missing columns to accounts table if they don't exist
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS subtype TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES accounts(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);

-- Insert base accounts if they don't exist
INSERT INTO accounts (id, code, name, type, subtype, balance, is_active) VALUES
(10, '1000', 'Cash', 'Asset', 'Current Asset', '0', true),
(11, '1100', 'Bank Account', 'Asset', 'Current Asset', '0', true),
(12, '1200', 'Accounts Receivable', 'Asset', 'Current Asset', '0', true),
(13, '1300', 'Inventory', 'Asset', 'Current Asset', '0', true),
(14, '1400', 'Prepaid Expenses', 'Asset', 'Current Asset', '0', true),
(15, '1500', 'Equipment', 'Asset', 'Fixed Asset', '0', true),
(16, '2000', 'Accounts Payable', 'Liability', 'Current Liability', '0', true),
(17, '2100', 'Unearned Revenue', 'Liability', 'Current Liability', '0', true),
(18, '2200', 'VAT Payable', 'Liability', 'Current Liability', '0', true),
(19, '3000', 'Owners Equity', 'Equity', 'Equity', '0', true),
(20, '3100', 'Retained Earnings', 'Equity', 'Retained Earnings', '0', true),
(21, '4000', 'Sales Revenue', 'Income', 'Operating Income', '0', true),
(22, '4100', 'Service Revenue', 'Income', 'Operating Income', '0', true),
(23, '5000', 'Cost of Goods Sold', 'Expense', 'Direct Costs', '0', true),
(24, '5100', 'Rent Expense', 'Expense', 'Operating Expense', '0', true),
(25, '5200', 'Salaries Expense', 'Expense', 'Operating Expense', '0', true),
(26, '5300', 'Utilities Expense', 'Expense', 'Operating Expense', '0', true),
(27, '5400', 'Marketing Expense', 'Expense', 'Operating Expense', '0', true),
(28, '5500', 'Office Supplies', 'Expense', 'Operating Expense', '0', true)
ON CONFLICT (id) DO UPDATE SET
  subtype = EXCLUDED.subtype,
  is_active = EXCLUDED.is_active;

-- Fix journal entries columns
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS created_by INTEGER DEFAULT 2;

-- Create notification_settings table if missing
CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  low_stock_alert BOOLEAN DEFAULT true,
  expiry_alert BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  report_schedules BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table for tracking all changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_queue table for notifications
CREATE TABLE IF NOT EXISTS email_queue (
  id SERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP
);

-- Update sequences to avoid conflicts
SELECT setval('accounts_id_seq', COALESCE((SELECT MAX(id) FROM accounts), 28) + 1, false);
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 2) + 1, false);

-- Optimize database performance
VACUUM ANALYZE;