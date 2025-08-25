-- Add new fields to gigs table for enhanced service creation
alter table public.gigs 
add column if not exists platform text not null default '',
add column if not exists content_type text not null default 'video' check (content_type in ('video', 'post')),
add column if not exists genre_category text not null default 'fashion_beauty' check (genre_category in ('fashion_beauty', 'health_fitness', 'food_cooking', 'travel', 'gaming', 'tech', 'business', 'lifestyle', 'entertainment', 'education', 'sports', 'music', 'automotive', 'home_garden', 'parenting')),
add column if not exists content_details jsonb default '{}',
add column if not exists deliverables text[] not null default '{}',
add column if not exists requirements text[] not null default '{}',
add column if not exists revisions_included integer not null default 1 check (revisions_included >= 0 and revisions_included <= 5),
add column if not exists preview_image_url text,
add column if not exists fast_delivery boolean default false,
add column if not exists fast_delivery_days integer check (fast_delivery_days >= 1 and fast_delivery_days <= 7);

-- Create enum-like check constraints for platforms (common social media platforms)
-- We'll validate platforms in the application layer for flexibility

-- Add indexes for the new fields
create index if not exists idx_gigs_platform on public.gigs(platform);
create index if not exists idx_gigs_content_type on public.gigs(content_type);
create index if not exists idx_gigs_genre_category on public.gigs(genre_category);
create index if not exists idx_gigs_fast_delivery on public.gigs(fast_delivery);

-- Update the existing price constraint to allow higher amounts for complex services
alter table public.gigs drop constraint if exists gigs_price_check;
alter table public.gigs add constraint gigs_price_check check (price >= 50 and price <= 100000);