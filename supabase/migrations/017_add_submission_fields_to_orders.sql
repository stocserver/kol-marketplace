-- Add submission tracking fields to orders table for fallback storage
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS submission_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_submission_message text,
ADD COLUMN IF NOT EXISTS last_submission_at timestamp with time zone;