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
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  gig_id uuid REFERENCES gigs(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique user-gig combinations (no duplicate favorites)
  UNIQUE(user_id, gig_id)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_gig_id ON public.favorites(gig_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at);

-- Enable Row Level Security on favorites table
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;

-- RLS Policy: Users can only see and manage their own favorites
CREATE POLICY "Users can view their own favorites" 
  ON public.favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" 
  ON public.favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" 
  ON public.favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE public.favorites IS 'User favorites for gigs - many to many relationship';
COMMENT ON COLUMN public.favorites.user_id IS 'References profiles.id - the user who favorited';
COMMENT ON COLUMN public.favorites.gig_id IS 'References gigs.id - the gig that was favorited';
COMMENT ON COLUMN public.favorites.created_at IS 'When the favorite was added';