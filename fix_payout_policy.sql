-- Fix the infinite recursion in payout_requests RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "KOLs can create payout requests" ON payout_requests;

-- Recreate the policy without the recursive check
CREATE POLICY "KOLs can create payout requests" ON payout_requests
  FOR INSERT WITH CHECK (
    kol_id = auth.uid() AND
    order_id IN (
      SELECT id FROM orders 
      WHERE kol_id = auth.uid() 
      AND status = 'completed'
    )
  );

-- Also ensure the other policies don't have issues
DROP POLICY IF EXISTS "KOLs can view own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;

-- Recreate clean policies
CREATE POLICY "KOLs can view own payout requests" ON payout_requests
  FOR SELECT USING (kol_id = auth.uid());

CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );