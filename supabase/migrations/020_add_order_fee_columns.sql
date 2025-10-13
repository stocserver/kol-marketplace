-- Add fee columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- Update total_amount for existing orders (set to amount for backwards compatibility)
UPDATE public.orders
SET total_amount = amount
WHERE total_amount IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.orders.stripe_fee IS 'Stripe processing fee (2.9% + $0.30)';
COMMENT ON COLUMN public.orders.service_fee IS 'Platform service fee (1% of base amount)';
COMMENT ON COLUMN public.orders.total_amount IS 'Total amount charged to sponsor (amount + stripe_fee + service_fee)';
