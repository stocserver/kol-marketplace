-- Create payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kol_id UUID NOT NULL REFERENCES profiles(id),
  amount INTEGER NOT NULL, -- Amount in cents (kol_earnings)
  platform_fee INTEGER NOT NULL, -- Platform fee in cents
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  
  -- Request details
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  kol_message TEXT, -- Optional message from KOL
  
  -- Admin action
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Stripe transfer details
  stripe_transfer_id TEXT, -- Stripe transfer ID when completed
  transfer_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- KOLs can view their own payout requests
CREATE POLICY "KOLs can view own payout requests" ON payout_requests
  FOR SELECT USING (kol_id = auth.uid());

-- KOLs can create payout requests for their completed orders
CREATE POLICY "KOLs can create payout requests" ON payout_requests
  FOR INSERT WITH CHECK (
    kol_id = auth.uid() AND
    order_id IN (
      SELECT id FROM orders 
      WHERE kol_id = auth.uid() 
      AND status = 'completed'
    )
  );

-- Admins can view all payout requests (will add admin role check later)
CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_payout_requests_order_id ON payout_requests(order_id);
CREATE INDEX idx_payout_requests_kol_id ON payout_requests(kol_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE INDEX idx_payout_requests_created_at ON payout_requests(created_at DESC);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER set_payout_requests_timestamp
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- Add payout request status to orders table (optional, for quick reference)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'not_requested' 
CHECK (payout_status IN ('not_requested', 'requested', 'approved', 'completed'));

-- Create index for payout_status
CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON orders(payout_status);