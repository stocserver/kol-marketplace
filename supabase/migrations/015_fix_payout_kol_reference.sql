-- Fix the payout_requests.kol_id foreign key reference

-- Drop the existing foreign key constraint
ALTER TABLE payout_requests DROP CONSTRAINT IF EXISTS payout_requests_kol_id_fkey;

-- Add the correct foreign key constraint to reference profiles(id) instead of auth.users(id)
ALTER TABLE payout_requests ADD CONSTRAINT payout_requests_kol_id_fkey 
  FOREIGN KEY (kol_id) REFERENCES profiles(id) ON DELETE CASCADE;