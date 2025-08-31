-- Enhanced profiles table with comprehensive user data
-- This migration adds all the fields needed for rich KOL and Sponsor profiles

alter table public.profiles 
-- Basic profile enhancements
add column if not exists bio text,
add column if not exists cover_image text,
add column if not exists country text,
add column if not exists languages text[] default '{}',

-- KOL specific fields
add column if not exists followers integer default 0 check (followers >= 0),
add column if not exists response_time text,
add column if not exists platforms jsonb default '{}', -- Store platform stats as JSON
add column if not exists avg_views_per_content integer default 0 check (avg_views_per_content >= 0),

-- Sponsor specific fields  
add column if not exists company_size text,
add column if not exists industry text,
add column if not exists website text,
add column if not exists total_campaigns integer default 0 check (total_campaigns >= 0),
add column if not exists total_spent integer default 0 check (total_spent >= 0);

-- Add indexes for new fields that will be queried frequently
create index if not exists idx_profiles_country on public.profiles(country);
create index if not exists idx_profiles_industry on public.profiles(industry);
create index if not exists idx_profiles_followers on public.profiles(followers);
create index if not exists idx_profiles_user_type on public.profiles(user_type);

-- Add GIN index for languages array and platforms jsonb for efficient queries
create index if not exists idx_profiles_languages on public.profiles using gin(languages);
create index if not exists idx_profiles_platforms on public.profiles using gin(platforms);

-- Update RLS policies to ensure users can still update their enhanced profiles
-- (The existing policies should already cover this, but let's be explicit)

-- Add some validation constraints for common fields (drop and recreate to avoid conflicts)
alter table public.profiles drop constraint if exists profiles_website_format;
alter table public.profiles add constraint profiles_website_format 
  check (website is null or website ~* '^https?://.*');

alter table public.profiles drop constraint if exists profiles_response_time_reasonable;
alter table public.profiles add constraint profiles_response_time_reasonable 
  check (response_time is null or length(response_time) <= 50);

alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles add constraint profiles_bio_length 
  check (bio is null or length(bio) <= 1000);

-- Add constraint for company size enum
alter table public.profiles drop constraint if exists profiles_company_size_valid;
alter table public.profiles add constraint profiles_company_size_valid
  check (company_size is null or company_size in (
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '500+ employees'
  ));

-- Add constraint for common industries
alter table public.profiles drop constraint if exists profiles_industry_valid;
alter table public.profiles add constraint profiles_industry_valid
  check (industry is null or industry in (
    'Fashion & Beauty', 'Technology', 'Food & Cooking', 'Travel', 'Fitness & Health',
    'Gaming', 'Entertainment', 'Business', 'Education', 'Art & Design', 'Music',
    'Finance', 'Healthcare', 'Real Estate', 'Automotive', 'Sports', 'Lifestyle'
  ));

-- Add constraint for country validation (major countries from the form)
alter table public.profiles drop constraint if exists profiles_country_valid;
alter table public.profiles add constraint profiles_country_valid
  check (country is null or country in (
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
    'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
    'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Philippines',
    'Brazil', 'Mexico', 'Argentina', 'India', 'Indonesia', 'Vietnam'
  ));

-- Create favorites table for users to favorite gigs
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  gig_id uuid references gigs(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  
  -- Ensure unique user-gig combinations (no duplicate favorites)
  unique(user_id, gig_id)
);

-- Add indexes for efficient querying
create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_favorites_gig_id on public.favorites(gig_id);
create index if not exists idx_favorites_created_at on public.favorites(created_at);

-- Enable Row Level Security on favorites table
alter table public.favorites enable row level security;

-- RLS Policy: Users can only see and manage their own favorites
create policy "Users can view their own favorites" 
  on public.favorites for select 
  using (auth.uid() = user_id);

create policy "Users can add their own favorites" 
  on public.favorites for insert 
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites" 
  on public.favorites for delete 
  using (auth.uid() = user_id);

-- Add helpful comments
comment on table public.favorites is 'User favorites for gigs - many to many relationship';
comment on column public.favorites.user_id is 'References profiles.id - the user who favorited';
comment on column public.favorites.gig_id is 'References gigs.id - the gig that was favorited';
comment on column public.favorites.created_at is 'When the favorite was added';