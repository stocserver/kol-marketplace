-- Fix the payout_requests table foreign key and policies

-- First, drop existing policies
DROP POLICY IF EXISTS "KOLs can view own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "KOLs can create payout requests" ON payout_requests;  
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;

-- Drop the existing foreign key constraint
ALTER TABLE payout_requests DROP CONSTRAINT IF EXISTS payout_requests_kol_id_fkey;

-- Add the correct foreign key constraint to reference profiles(id)
ALTER TABLE payout_requests ADD CONSTRAINT payout_requests_kol_id_fkey 
  FOREIGN KEY (kol_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Recreate the RLS policies with the correct logic
CREATE POLICY "KOLs can view own payout requests" ON payout_requests
  FOR SELECT USING (kol_id = auth.uid());

CREATE POLICY "KOLs can create payout requests" ON payout_requests
  FOR INSERT WITH CHECK (
    kol_id = auth.uid() AND
    order_id IN (
      SELECT id FROM orders 
      WHERE kol_id = auth.uid() 
      AND status = 'completed'
    )
  );

CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );