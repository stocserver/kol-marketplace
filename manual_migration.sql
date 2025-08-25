-- Manual migration to add missing columns to gigs table
-- Run this in your Supabase SQL editor

-- Add new fields to gigs table for enhanced service creation
ALTER TABLE public.gigs 
ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'video' CHECK (content_type IN ('video', 'post')),
ADD COLUMN IF NOT EXISTS genre_category text NOT NULL DEFAULT 'fashion_beauty' CHECK (genre_category IN ('fashion_beauty', 'health_fitness', 'food_cooking', 'travel', 'gaming', 'tech', 'business', 'lifestyle', 'entertainment', 'education', 'sports', 'music', 'automotive', 'home_garden', 'parenting')),
ADD COLUMN IF NOT EXISTS deliverables text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS requirements text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS revisions_included integer NOT NULL DEFAULT 1 CHECK (revisions_included >= 0 AND revisions_included <= 5),
ADD COLUMN IF NOT EXISTS preview_image_url text,
ADD COLUMN IF NOT EXISTS fast_delivery boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fast_delivery_days integer CHECK (fast_delivery_days >= 1 AND fast_delivery_days <= 7);

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_gigs_platform ON public.gigs(platform);
CREATE INDEX IF NOT EXISTS idx_gigs_content_type ON public.gigs(content_type);
CREATE INDEX IF NOT EXISTS idx_gigs_genre_category ON public.gigs(genre_category);
CREATE INDEX IF NOT EXISTS idx_gigs_fast_delivery ON public.gigs(fast_delivery);

-- Update the existing price constraint to allow higher amounts for complex services
ALTER TABLE public.gigs DROP CONSTRAINT IF EXISTS gigs_price_check;
ALTER TABLE public.gigs ADD CONSTRAINT gigs_price_check CHECK (price >= 50 AND price <= 100000);

-- Create messaging system tables
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone NULL,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create unique index to ensure unique conversation between two users (regardless of order)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_participants 
ON public.conversations (least(participant_1, participant_2), greatest(participant_1, participant_2));

-- Add conversation_id to messages table to link messages to conversations
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- Create function to update conversation's updated_at timestamp when a message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations 
  SET updated_at = now(), last_message_id = new.id
  WHERE id = new.conversation_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- RLS (Row Level Security) policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Messages policies: users can only see messages they sent or received
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

DROP POLICY IF EXISTS "Users can insert messages they send" ON public.messages;
CREATE POLICY "Users can insert messages they send" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

DROP POLICY IF EXISTS "Users can update messages they sent" ON public.messages;
CREATE POLICY "Users can update messages they sent" ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id
  );

-- Conversations policies: users can only see conversations they participate in
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

DROP POLICY IF EXISTS "Users can create conversations they participate in" ON public.conversations;
CREATE POLICY "Users can create conversations they participate in" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );