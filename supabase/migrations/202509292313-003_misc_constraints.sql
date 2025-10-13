-- Fix migration conflicts by dropping and recreating constraints
-- Run this directly in Supabase SQL editor if needed

-- Drop existing constraints that might conflict
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_website_format;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_response_time_reasonable;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_bio_length;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_size_valid;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_industry_valid;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_country_valid;

-- Create favorites table if it doesn't exist
-- favorites DDL moved to manual_migration.sql
