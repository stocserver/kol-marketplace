-- Add missing columns to reviews table if they don't exist
DO $$
BEGIN
  -- Add kol_response column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reviews' AND column_name = 'kol_response') THEN
    ALTER TABLE public.reviews ADD COLUMN kol_response text;
  END IF;

  -- Add kol_response_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reviews' AND column_name = 'kol_response_at') THEN
    ALTER TABLE public.reviews ADD COLUMN kol_response_at timestamp with time zone;
  END IF;
END $$;

-- Add missing policies if they don't exist
DO $$
BEGIN
  -- KOLs can respond to reviews about them
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'KOLs can respond to reviews about them') THEN
    CREATE POLICY "KOLs can respond to reviews about them"
      ON public.reviews FOR UPDATE
      USING (kol_id = auth.uid())
      WITH CHECK (kol_id = auth.uid());
  END IF;
END $$;