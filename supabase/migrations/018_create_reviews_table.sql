-- Create reviews table for order ratings and feedback
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  kol_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  kol_response text,
  kol_response_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure only one review per order
  UNIQUE(order_id),

  -- Ensure review is submitted within 48 hours of order completion
  CONSTRAINT review_time_limit CHECK (
    created_at <= (
      SELECT o.updated_at + INTERVAL '48 hours'
      FROM public.orders o
      WHERE o.id = order_id
      AND o.status = 'completed'
    )
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_kol_id ON public.reviews(kol_id);
CREATE INDEX IF NOT EXISTS idx_reviews_sponsor_id ON public.reviews(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Sponsors can view and manage their own reviews
CREATE POLICY "Sponsors can view their own reviews"
  ON public.reviews FOR SELECT
  USING (sponsor_id = auth.uid());

CREATE POLICY "Sponsors can create reviews for their orders"
  ON public.reviews FOR INSERT
  WITH CHECK (
    sponsor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id
      AND sponsor_id = auth.uid()
      AND status = 'completed'
    )
  );

-- Reviews cannot be updated by sponsors once submitted (reviews are final)
-- Only KOLs can update their response field

-- KOLs can view reviews about them
CREATE POLICY "KOLs can view reviews about them"
  ON public.reviews FOR SELECT
  USING (kol_id = auth.uid());

-- KOLs can add/update their response to reviews
CREATE POLICY "KOLs can respond to reviews about them"
  ON public.reviews FOR UPDATE
  USING (kol_id = auth.uid())
  WITH CHECK (kol_id = auth.uid());

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();