-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved')),
  resolution_type TEXT CHECK (resolution_type IN ('continue', 'cancel_refund')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS disputes_order_id_idx ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS disputes_opened_by_idx ON public.disputes(opened_by);
CREATE INDEX IF NOT EXISTS disputes_status_idx ON public.disputes(status);
CREATE INDEX IF NOT EXISTS disputes_created_at_idx ON public.disputes(created_at DESC);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to view disputes they're involved in (as sponsor or KOL of the order)
CREATE POLICY "Users can view disputes for their orders"
  ON public.disputes
  FOR SELECT
  USING (
    opened_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = disputes.order_id
      AND (orders.sponsor_id = auth.uid() OR orders.kol_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Allow users to create disputes for their orders
CREATE POLICY "Users can create disputes for their orders"
  ON public.disputes
  FOR INSERT
  WITH CHECK (
    opened_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND (orders.sponsor_id = auth.uid() OR orders.kol_id = auth.uid())
    )
  );

-- Only admins can update disputes (resolve them)
CREATE POLICY "Admins can update disputes"
  ON public.disputes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Add comments
COMMENT ON TABLE public.disputes IS 'Stores order disputes opened by sponsors or KOLs';
COMMENT ON COLUMN public.disputes.resolution_type IS 'continue: change order back to in_progress, cancel_refund: cancel order and refund base amount to sponsor';
