-- Update admin user with hashed password for 'admin123'
UPDATE users 
SET password = '$2b$10$5RsZ2.L3KZjZlKjSgTYpE.7b4Ll.rIE5nZxZ0d3e4.uVGQZLaKT8y', 
    email = 'maged.morgan@morganerp.com',
    name = 'Maged Morgan',
    role = 'admin'
WHERE username = 'admin';

-- Add subtype column to accounts table if missing
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subtype TEXT DEFAULT '';

-- Insert some initial products to prevent empty state errors
INSERT INTO products (name, drug_name, sku, cost_price, selling_price, quantity, unit_of_measure, status, expiry_date)
VALUES 
  ('Paracetamol 500mg', 'Paracetamol', 'PARA-500', 5.50, 12.00, 100, 'Tablets', 'active', '2025-12-31'),
  ('Amoxicillin 250mg', 'Amoxicillin', 'AMOX-250', 8.00, 18.00, 50, 'Capsules', 'active', '2025-08-15'),
  ('Aspirin 100mg', 'Aspirin', 'ASP-100', 3.00, 8.00, 200, 'Tablets', 'active', '2026-03-20'),
  ('Ibuprofen 400mg', 'Ibuprofen', 'IBU-400', 6.00, 15.00, 30, 'Tablets', 'warning', '2025-02-10'),
  ('Vitamin C 1000mg', 'Ascorbic Acid', 'VITC-1000', 4.00, 10.00, 5, 'Tablets', 'critical', '2025-01-15')
ON CONFLICT (sku) DO NOTHING;

-- Add initial accounts if not exist
INSERT INTO accounts (code, name, type, balance)
VALUES 
  ('1000', 'Cash', 'asset', 50000),
  ('1100', 'Bank Account', 'asset', 100000),
  ('2000', 'Accounts Payable', 'liability', 0),
  ('3000', 'Owner Equity', 'equity', 150000),
  ('4000', 'Sales Revenue', 'revenue', 0),
  ('5000', 'Cost of Goods Sold', 'expense', 0)
ON CONFLICT (code) DO NOTHING;

-- Add initial customers
INSERT INTO customers (name, email, phone, company, sector)
VALUES 
  ('Cairo Medical Center', 'contact@cairomedical.com', '+20 2 2222 3333', 'Cairo Medical Center', 'Healthcare'),
  ('Alexandria Pharmacy', 'info@alexpharmacy.com', '+20 3 4444 5555', 'Alexandria Pharmacy', 'Retail'),
  ('Giza Hospital', 'admin@gizahospital.com', '+20 2 3333 4444', 'Giza Hospital', 'Healthcare')
ON CONFLICT DO NOTHING;