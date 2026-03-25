-- Database Schema for Prestamos Urgentes

-- 1. Profiles (for users/roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'staff', -- 'admin', 'staff', 'viewer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 2. Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Properties (Guarantees)
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  estimated_value NUMERIC(15, 2),
  location TEXT,
  status TEXT DEFAULT 'available', -- 'available', 'pledged'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Investors & Referrers
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'investor', 'referrer'
  phone TEXT,
  email TEXT,
  commission_rate NUMERIC(5, 2) DEFAULT 0,
  balance NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Loans
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  amount NUMERIC(15, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL, -- Monthly rate
  moratorio_rate NUMERIC(5, 2) NOT NULL,
  term_months INTEGER NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'overdue', 'legal', 'paid'
  light TEXT DEFAULT 'green', -- 'green', 'yellow', 'red', 'ttc'
  start_date DATE DEFAULT CURRENT_DATE,
  next_payment_date DATE,
  property_id UUID REFERENCES properties(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  type TEXT NOT NULL, -- 'interest', 'capital', 'moratorio', 'full'
  applied_capital NUMERIC(15, 2) DEFAULT 0,
  applied_interest NUMERIC(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. RLS (Row Level Security) - Simplified for start
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write for now (basic setup)
CREATE POLICY "Authenticated users can do everything" ON profiles FOR ALL USING (true);
CREATE POLICY "Authenticated users can do everything" ON clients FOR ALL USING (true);
CREATE POLICY "Authenticated users can do everything" ON properties FOR ALL USING (true);
CREATE POLICY "Authenticated users can do everything" ON partners FOR ALL USING (true);
CREATE POLICY "Authenticated users can do everything" ON loans FOR ALL USING (true);
CREATE POLICY "Authenticated users can do everything" ON payments FOR ALL USING (true);
