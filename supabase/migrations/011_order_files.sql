-- Create order_files table for storing deliverable files
CREATE TABLE IF NOT EXISTS order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- in bytes
  file_type TEXT NOT NULL,    -- MIME type
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see files for orders they are part of (KOL or Sponsor)
CREATE POLICY "Users can view order files they have access to" ON order_files
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE sponsor_id = auth.uid() OR kol_id = auth.uid()
    )
  );

-- Policy: Only KOLs can upload files to their orders
CREATE POLICY "KOLs can upload files to their orders" ON order_files
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders 
      WHERE kol_id = auth.uid()
    )
  );

-- Policy: Only KOLs can update/delete their uploaded files
CREATE POLICY "KOLs can manage their uploaded files" ON order_files
  FOR ALL USING (
    uploaded_by = auth.uid() AND
    order_id IN (
      SELECT id FROM orders 
      WHERE kol_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_order_files_order_id ON order_files(order_id);
CREATE INDEX idx_order_files_uploaded_by ON order_files(uploaded_by);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON order_files
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- Create storage bucket for order files
INSERT INTO storage.buckets (id, name, public) VALUES ('order-files', 'order-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for order files
CREATE POLICY "Users can view order files they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-files' AND 
    name LIKE '%' || (auth.jwt() ->> 'sub') || '%' OR
    name LIKE ANY(
      SELECT ARRAY[o.id || '/%']
      FROM orders o
      WHERE o.sponsor_id = (auth.jwt() ->> 'sub')::uuid OR o.kol_id = (auth.jwt() ->> 'sub')::uuid
    )
  );

CREATE POLICY "KOLs can upload files to their orders" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'order-files' AND
    name LIKE ANY(
      SELECT ARRAY[o.id || '/%']
      FROM orders o
      WHERE o.kol_id = (auth.jwt() ->> 'sub')::uuid
    )
  );

CREATE POLICY "Users can delete their uploaded files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'order-files' AND
    owner = (auth.jwt() ->> 'sub')::uuid
  );