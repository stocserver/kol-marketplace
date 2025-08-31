-- Add missing Stripe Connect columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);

-- Verify columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name IN ('stripe_account_id', 'stripe_charges_enabled')
    ) THEN
        RAISE NOTICE 'Stripe columns added successfully to profiles table';
    ELSE
        RAISE EXCEPTION 'Failed to add Stripe columns to profiles table';
    END IF;
END $$;