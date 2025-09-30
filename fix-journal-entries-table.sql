-- Fix missing columns in journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'posted' NOT NULL,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS created_by INTEGER,
ADD COLUMN IF NOT EXISTS total_debit NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credit NUMERIC NOT NULL DEFAULT 0;

-- Add foreign key constraint for created_by
ALTER TABLE journal_entries 
ADD CONSTRAINT journal_entries_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id);

-- Fix missing columns in accounts table for accounting summary
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL;

-- Fix missing columns in invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' NOT NULL;