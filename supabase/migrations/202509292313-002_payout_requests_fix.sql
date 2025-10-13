-- Payout requests fixes (merged)
-- Consolidates table FK fix and clean RLS policies for payout_requests

-- Foreign key correction (if needed)
ALTER TABLE payout_requests DROP CONSTRAINT IF EXISTS payout_requests_kol_id_fkey;
ALTER TABLE payout_requests ADD CONSTRAINT payout_requests_kol_id_fkey 
  FOREIGN KEY (kol_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Enable RLS (idempotent)
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Reset policies
DROP POLICY IF EXISTS "KOLs can view own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "KOLs can create payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;

-- View own
CREATE POLICY "KOLs can view own payout requests" ON payout_requests
  FOR SELECT USING (kol_id = auth.uid());

-- Create only for completed own orders
CREATE POLICY "KOLs can create payout requests" ON payout_requests
  FOR INSERT WITH CHECK (
    kol_id = auth.uid() AND
    order_id IN (
      SELECT id FROM orders 
      WHERE kol_id = auth.uid() 
      AND status = 'completed'
    )
  );

-- Admins full access
CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );
