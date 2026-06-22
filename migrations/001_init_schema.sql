-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  verified_email TEXT NOT NULL,
  dob TEXT NOT NULL,
  profile_data JSONB NOT NULL,
  stripe_customer_id TEXT,
  subscription_id TEXT,
  plan_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('created', 'payment_pending', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create removal_runs table
CREATE TABLE IF NOT EXISTS removal_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE,
  run_data JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'in_progress', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_customers_token ON customers(token);
CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX idx_removal_runs_customer_id ON removal_runs(customer_id);
CREATE INDEX idx_removal_runs_token ON removal_runs(token);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_stripe_session_id ON payments(stripe_session_id);

-- Enable RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE removal_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy: anon users can read their own customer data via token
CREATE POLICY "customers_read_via_token" ON customers
  FOR SELECT
  USING (TRUE); -- Will be restricted by app logic based on token

-- Create policy: service role can do everything
CREATE POLICY "enable_all_for_service_role" ON customers
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "enable_all_for_service_role" ON removal_runs
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "enable_all_for_service_role" ON payments
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
