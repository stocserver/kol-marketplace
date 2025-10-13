-- Test query to check if messaging tables exist
-- Run this in Supabase SQL Editor to see what's missing

-- Check if messages table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'messages'
) as messages_exists;

-- Check if conversations table exists  
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'conversations'
) as conversations_exists;

-- Check if gigs table has new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'gigs' 
AND table_schema = 'public'
AND column_name IN ('platform', 'content_type', 'genre_category');-- Additional diagnostics
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='''public''' AND table_name='''favorites''') as favorites_exists;
